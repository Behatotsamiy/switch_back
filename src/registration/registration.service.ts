import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';
import { Registration, RegistrationStatus } from './entities/registration.entity';
import { Event, EventStatus } from '../event/entities/event.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { TicketService } from './ticket.service';
import { getTicketHtml } from './templates/ticket.template';

@Injectable()
export class RegistrationService {
  private readonly storageDir = path.join(process.cwd(), 'storage', 'tickets');

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly ticketService: TicketService,
  ) {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async register(userId: string, dto: CreateRegistrationDto): Promise<Registration> {
    const event = await this.eventRepo.findOne({
      where: { id: dto.eventId },
      relations: { registrations: true },
    });
    if (!event) throw new NotFoundException('Event not found');

    if (event.status === EventStatus.FINISHED || event.status === EventStatus.CANCELLED) {
      throw new BadRequestException('Регистрация на это событие закрыта');
    }

    const existing = await this.registrationRepo.findOne({
      where: { userId, eventId: dto.eventId },
    });
    if (existing && existing.status === RegistrationStatus.ACTIVE) {
      throw new BadRequestException('Вы уже зарегистрированы на это событие');
    }

    if (event.maxParticipants) {
      const activeCount = event.registrations.filter(
        (r) => r.status === RegistrationStatus.ACTIVE,
      ).length;
      if (activeCount >= event.maxParticipants) {
        throw new BadRequestException('Свободных мест больше нет');
      }
    }

    if (existing) {
      existing.status = RegistrationStatus.ACTIVE;
      // если реактивируем отменённую регистрацию, оставляем старый ticketNumber —
      // билет с тем же номером продолжает быть валидным
      return this.registrationRepo.save(existing);
    }

    const registration = this.registrationRepo.create({
      userId,
      eventId: dto.eventId,
      ticketNumber: this.ticketService.generateTicketNumber(),
    });
    return this.registrationRepo.save(registration);
  }

  async cancel(userId: string, registrationId: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({ where: { id: registrationId } });
    if (!registration) throw new NotFoundException('Registration not found');
    if (registration.userId !== userId) {
      throw new ForbiddenException('Это не ваша регистрация');
    }
    registration.status = RegistrationStatus.CANCELLED;
    return this.registrationRepo.save(registration);
  }

  async findMyRegistrations(userId: string): Promise<Registration[]> {
    return this.registrationRepo.find({
      where: { userId },
      relations: { event: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByEvent(eventId: string): Promise<Registration[]> {
    return this.registrationRepo.find({
      where: { eventId },
      relations: { user: true },
      order: { createdAt: 'ASC' },
    });
  }

  async markAttendance(registrationId: string, attended: boolean): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({ where: { id: registrationId } });
    if (!registration) throw new NotFoundException('Registration not found');
    registration.attended = attended;
    return this.registrationRepo.save(registration);
  }

  // ─── Билет ──────────────────────────────────────────────────────

  private async getOwnedRegistration(userId: string, registrationId: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({
      where: { id: registrationId },
      relations: { event: true, user: true },
    });
    if (!registration) throw new NotFoundException('Registration not found');
    if (registration.userId !== userId) {
      throw new ForbiddenException('Это не ваш билет');
    }
    if (registration.status !== RegistrationStatus.ACTIVE) {
      throw new BadRequestException('Регистрация отменена, билет недействителен');
    }
    return registration;
  }

  // JSON с данными для отображения билета прямо в приложении (карточка с QR, как на скриншоте)
  async getTicketData(userId: string, registrationId: string) {
    const registration = await this.getOwnedRegistration(userId, registrationId);
    const qrCodeDataUrl = await this.ticketService.generateQrDataUrl(registration);

    return {
      ticketNumber: registration.ticketNumber,
      qrCodeDataUrl,
      event: {
        id: registration.event.id,
        title: registration.event.title,
        startDate: registration.event.startDate,
        location: registration.event.location,
      },
      holder: `${registration.user.firstName} ${registration.user.lastName}`,
    };
  }

  // Генерация и скачивание PDF-версии билета
  async downloadTicketPdf(userId: string, registrationId: string): Promise<string> {
    const registration = await this.getOwnedRegistration(userId, registrationId);
    const filePath = path.join(this.storageDir, `${registration.ticketNumber}.pdf`);

    // если PDF уже сгенерирован раньше — не рендерим повторно
    if (fs.existsSync(filePath)) return filePath;

    const qrCodeDataUrl = await this.ticketService.generateQrDataUrl(registration);
    const html = getTicketHtml({
      fullName: `${registration.user.firstName} ${registration.user.lastName}`,
      eventTitle: registration.event.title,
      eventDate: new Date(registration.event.startDate).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
      eventLocation: registration.event.location,
      ticketNumber: registration.ticketNumber,
      qrCodeDataUrl,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.pdf({ path: filePath, width: '440px', height: '740px', printBackground: true });
    } finally {
      await browser.close();
    }

    return filePath;
  }

  // ─── Check-in на входе (для админов) ───────────────────────────

  async checkIn(ticketNumber: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({
      where: { ticketNumber },
      relations: { user: true, event: true },
    });
    if (!registration) throw new NotFoundException('Билет не найден');
    if (registration.status !== RegistrationStatus.ACTIVE) {
      throw new BadRequestException('Билет недействителен (регистрация отменена)');
    }
    if (registration.attended) {
      throw new BadRequestException('По этому билету уже отмечен вход');
    }

    registration.attended = true;
    return this.registrationRepo.save(registration);
  }
}