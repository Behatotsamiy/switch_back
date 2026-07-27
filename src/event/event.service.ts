import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Speaker } from '../speaker/entities/speaker.entity';
import { CertificateService } from '../certificate/certificate.service';

@Injectable()
export class EventService {
  constructor(
     @InjectRepository(Event)
  private readonly eventRepo: Repository<Event>,

  @InjectRepository(Speaker)
  private readonly speakerRepo: Repository<Speaker>,

  private readonly certificateService: CertificateService,
  ) {}

  async create(dto: CreateEventDto): Promise<Event> {
    const event = this.eventRepo.create(dto);
    return this.eventRepo.save(event);
  }

  async findAll(): Promise<Event[]> {
    return this.eventRepo.find({
      relations: {
        speakers: true,
      },
      order: { startDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: {
        speakers: true,
        registrations: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async update(id: string, dto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepo.remove(event);
  }

  async updateStatus(id: string, status: EventStatus): Promise<Event> {
    const event = await this.findOne(id);
    event.status = status;
    return this.eventRepo.save(event);
  }

  async attachSpeaker(eventId: string, speakerId: string): Promise<Event> {
  const event = await this.findOne(eventId);
  const speaker = await this.speakerRepo.findOne({ where: { id: speakerId } });
  if (!speaker) throw new NotFoundException('Speaker not found');

  const alreadyAttached = event.speakers.some((s) => s.id === speakerId);
  if (alreadyAttached) {
    throw new BadRequestException('Speaker already attached to this event');
  }

  event.speakers.push(speaker);
  return this.eventRepo.save(event);
}

async detachSpeaker(eventId: string, speakerId: string): Promise<Event> {
  const event = await this.findOne(eventId);
  event.speakers = event.speakers.filter((s) => s.id !== speakerId);
  return this.eventRepo.save(event);
}
async finishEvent(id: string): Promise<Event> {
  const event = await this.findOne(id);
  if (event.status === EventStatus.FINISHED) {
    throw new BadRequestException('Event is already finished');
  }
  event.status = EventStatus.FINISHED;
  const saved = await this.eventRepo.save(event);

  // генерация сертификатов — не блокируем ответ, пусть работает в фоне
  this.certificateService.generateForEvent(id).catch((err) => {
    console.error('Certificate generation failed:', err);
  });

  return saved;
}
}