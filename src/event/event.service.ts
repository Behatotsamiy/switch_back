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


@Injectable()
export class EventService {
  constructor(
     @InjectRepository(Event)
  private readonly eventRepo: Repository<Event>,

  
  ) {}

  async create(dto: CreateEventDto): Promise<Event> {
    const event = this.eventRepo.create(dto);
    return this.eventRepo.save(event);
  }

  async findAll(): Promise<Event[]> {
    return this.eventRepo.find({

      order: { startDate: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },

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

 


async finishEvent(id: string): Promise<Event> {
  const event = await this.findOne(id);
  if (event.status === EventStatus.FINISHED) {
    throw new BadRequestException('Event is already finished');
  }
  event.status = EventStatus.FINISHED;
  const saved = await this.eventRepo.save(event);

  // генерация сертификатов — не блокируем ответ, пусть работает в фоне


  return saved;
}
}