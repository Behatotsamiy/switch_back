import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Speaker } from './entities/speaker.entity';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';

@Injectable()
export class SpeakerService {
  constructor(
    @InjectRepository(Speaker)
    private readonly speakerRepo: Repository<Speaker>,
  ) {}

  async create(dto: CreateSpeakerDto): Promise<Speaker> {
    const speaker = this.speakerRepo.create(dto);
    return this.speakerRepo.save(speaker);
  }

  async findAll(): Promise<Speaker[]> {
    return this.speakerRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Speaker> {
    const speaker = await this.speakerRepo.findOne({
      where: { id },
      relations:{
        events:true
      },
    });
    if (!speaker) throw new NotFoundException('Speaker not found');
    return speaker;
  }

  async update(id: string, dto: UpdateSpeakerDto): Promise<Speaker> {
    const speaker = await this.findOne(id);
    Object.assign(speaker, dto);
    return this.speakerRepo.save(speaker);
  }

  async remove(id: string): Promise<void> {
    const speaker = await this.findOne(id);
    await this.speakerRepo.remove(speaker);
  }
}