import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Speaker } from '../speaker/entities/speaker.entity';
import { CertificateModule } from '../certificate/certificate.module';
import { SpeakerModule } from '../speaker/speaker.module';
import { Certificate } from '../certificate/entities/certificate.entity';
import { Event } from './entities/event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Speaker, Certificate]), SpeakerModule, CertificateModule],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
