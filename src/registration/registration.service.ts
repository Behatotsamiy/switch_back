import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration, RegistrationStatus } from './entities/registration.entity';
import { Event, EventStatus } from '../event/entities/event.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async register(userId: string, dto: CreateRegistrationDto): Promise<Registration> {
    const event = await this.eventRepo.findOne({
      where: { id: dto.eventId },
      relations:{
        registrations: true
      },
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

    // если раньше отменял регистрацию — реактивируем, а не создаём дубль
    if (existing) {
      existing.status = RegistrationStatus.ACTIVE;
      return this.registrationRepo.save(existing);
    }

    const registration = this.registrationRepo.create({
      userId,
      eventId: dto.eventId,
    });
    return this.registrationRepo.save(registration);
  }

  async cancel(userId: string, registrationId: string): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({
      where: { id: registrationId },
    });
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
      relations: {
        event: true
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findByEvent(eventId: string): Promise<Registration[]> {
    return this.registrationRepo.find({
      where: { eventId },
      relations: {
        user: true,
        event: true,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async markAttendance(registrationId: string, attended: boolean): Promise<Registration> {
    const registration = await this.registrationRepo.findOne({
      where: { id: registrationId },
    });
    if (!registration) throw new NotFoundException('Registration not found');

    registration.attended = attended;
    return this.registrationRepo.save(registration);
  }
}