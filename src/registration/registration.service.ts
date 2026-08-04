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
import { Registration, RegistrationStatus, PaymentStatus } from './entities/registration.entity';
import { Event, EventStatus } from '../event/entities/event.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { TicketService } from './ticket.service';
import { getTicketHtml } from './templates/ticket.template';
import { Response } from 'express';

@Injectable()
export class RegistrationService {
  private readonly ticketsDir = path.join(process.cwd(), 'storage', 'tickets');
  private readonly receiptsDir = path.join(process.cwd(), 'storage', 'receipts');

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly ticketService: TicketService,
  ) {
    [this.ticketsDir, this.receiptsDir].forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
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

    const existing = await this.registrationRepo.findOne({ where: { userId, eventId: dto.eventId } });
    if (existing && existing.status === RegistrationStatus.ACTIVE) {
      throw new BadRequestException('Вы уже зарегистрированы на это событие');
    }

    if (event.maxParticipants) {
      const activeCount = event.registrations.filter((r) => r.status === RegistrationStatus.ACTIVE).length;
      if (activeCount >= event.maxParticipants) {
        throw new BadRequestException('Свободных мест больше нет');
      }
    }

    const isPaid = Number(event.price) > 0;

    if (existing) {
      existing.status = RegistrationStatus.ACTIVE;
      return this.registrationRepo.save(existing);
    }

    const registration = this.registrationRepo.create({
      userId,
      eventId: dto.eventId,
      ticketNumber: this.ticketService.generateTicketNumber(),
      paymentStatus: isPaid ? PaymentStatus.PENDING : PaymentStatus.NOT_REQUIRED,
      orderNumber: isPaid ? await this.generateOrderNumber() : null,
    });
    return this.registrationRepo.save(registration);
  }

  private async generateOrderNumber(): Promise<string> {
    // человекочитаемый номер для назначения платежа в банковском переводе
    const count = await this.registrationRepo.count();
    return `ORDER-${1000 + count + 1}`;
  }

  async cancel(userId: string, registrationId: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({ where: { id: registrationId } });
    if (!registration) throw new NotFoundException('Registration not found');
    if (registration.userId !== userId) throw new ForbiddenException('Это не ваша регистрация');
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

  // ─── Оплата ─────────────────────────────────────────────────────

  private async getOwnedRegistrationRaw(userId: string, registrationId: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({ where: { id: registrationId } });
    if (!registration) throw new NotFoundException('Registration not found');
    if (registration.userId !== userId) throw new ForbiddenException('Это не ваша регистрация');
    return registration;
  }

  async uploadReceipt(userId: string, registrationId: string, file: Express.Multer.File): Promise<Registration> {
    const registration = await this.getOwnedRegistrationRaw(userId, registrationId);

    if (registration.paymentStatus === PaymentStatus.NOT_REQUIRED) {
      throw new BadRequestException('Оплата для этого события не требуется');
    }
    if (registration.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Оплата уже подтверждена');
    }

    registration.receiptUrl = `/storage/receipts/${file.filename}`;
    registration.paymentStatus = PaymentStatus.PENDING; // на случай повторной загрузки после REJECTED
    registration.paymentRejectionReason = null;
    return this.registrationRepo.save(registration);
  }

  async findPendingPayments(): Promise<Registration[]> {
    return this.registrationRepo.find({
      where: { paymentStatus: PaymentStatus.PENDING },
      relations: { user: true, event: true },
      order: { createdAt: 'ASC' },
    });
  }
  async streamReceipt(registrationId: string, res: Response): Promise<void> {
  const registration = await this.registrationRepo.findOne({ where: { id: registrationId } });
  if (!registration || !registration.receiptUrl) {
    throw new NotFoundException('Чек не найден');
  }
  const filePath = path.join(process.cwd(), registration.receiptUrl.replace(/^\//, ''));
  res.sendFile(filePath);
}

  async approvePayment(registrationId: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({ where: { id: registrationId } });
    if (!registration) throw new NotFoundException('Registration not found');
    if (!registration.receiptUrl) {
      throw new BadRequestException('Пользователь ещё не загрузил чек');
    }
    registration.paymentStatus = PaymentStatus.PAID;
    return this.registrationRepo.save(registration);
  }

  async rejectPayment(registrationId: string, reason?: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({ where: { id: registrationId } });
    if (!registration) throw new NotFoundException('Registration not found');
    registration.paymentStatus = PaymentStatus.REJECTED;
    registration.paymentRejectionReason = reason || 'Чек не подтверждён';
    return this.registrationRepo.save(registration);
  }

  // ─── Билет ──────────────────────────────────────────────────────

  private async getOwnedRegistration(userId: string, registrationId: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({
      where: { id: registrationId },
      relations: { event: true, user: true },
    });
    if (!registration) throw new NotFoundException('Registration not found');
    if (registration.userId !== userId) throw new ForbiddenException('Это не ваш билет');
    if (registration.status !== RegistrationStatus.ACTIVE) {
      throw new BadRequestException('Регистрация отменена, билет недействителен');
    }
    return registration;
  }

  async getTicketData(userId: string, registrationId: string) {
    const registration = await this.getOwnedRegistration(userId, registrationId);
    const qrCodeDataUrl =
      registration.paymentStatus === PaymentStatus.PAID || registration.paymentStatus === PaymentStatus.NOT_REQUIRED
        ? await this.ticketService.generateQrDataUrl(registration)
        : null; // QR не выдаём, пока оплата не подтверждена — нечего сканировать на входе

    return {
      ticketNumber: registration.ticketNumber,
      qrCodeDataUrl,
      paymentStatus: registration.paymentStatus,
      orderNumber: registration.orderNumber,
      paymentRejectionReason: registration.paymentRejectionReason,
      event: {
        id: registration.event.id,
        title: registration.event.title,
        startDate: registration.event.startDate,
        location: registration.event.location,
        price: registration.event.price,
      },
      holder: `${registration.user.firstName} ${registration.user.lastName}`,
    };
  }

  async downloadTicketPdf(userId: string, registrationId: string): Promise<string> {
    const registration = await this.getOwnedRegistration(userId, registrationId);

    if (registration.paymentStatus === PaymentStatus.PENDING || registration.paymentStatus === PaymentStatus.REJECTED) {
      throw new BadRequestException('Билет будет доступен после подтверждения оплаты');
    }

    const filePath = path.join(this.ticketsDir, `${registration.ticketNumber}.pdf`);
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

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.pdf({ path: filePath, width: '440px', height: '740px', printBackground: true });
    } finally {
      await browser.close();
    }
    return filePath;
  }

  // ─── Check-in ───────────────────────────────────────────────────

  async checkIn(ticketNumber: string, eventId: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({
      where: { ticketNumber },
      relations: { user: true, event: true },
    });
    if (!registration) throw new NotFoundException('Билет не найден — недействительный QR-код');

    if (registration.eventId !== eventId) {
      throw new BadRequestException('Этот билет выдан на другое мероприятие');
    }
    if (registration.status !== RegistrationStatus.ACTIVE) {
      throw new BadRequestException('Билет недействителен (регистрация отменена)');
    }
    if (registration.paymentStatus === PaymentStatus.PENDING) {
      throw new BadRequestException('Оплата ещё не подтверждена — вход невозможен');
    }
    if (registration.paymentStatus === PaymentStatus.REJECTED) {
      throw new BadRequestException('Оплата отклонена — билет недействителен');
    }
    if (registration.attended) {
      throw new BadRequestException('По этому билету уже отмечен вход');
    }

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const eventStart = startOfDay(new Date(registration.event.startDate));
    const eventEnd = registration.event.endDate
      ? endOfDay(new Date(registration.event.endDate))
      : endOfDay(new Date(registration.event.startDate));
    const now = new Date();

    if (now < eventStart) {
      const diffDays = Math.ceil((eventStart.getTime() - startOfDay(now).getTime()) / 86400000);
      throw new BadRequestException(`Check-in откроется в день мероприятия — через ${diffDays} дн.`);
    }
    if (now > eventEnd) {
      throw new BadRequestException('Мероприятие уже завершилось — check-in закрыт');
    }

    registration.attended = true;
    return this.registrationRepo.save(registration);
  }
}