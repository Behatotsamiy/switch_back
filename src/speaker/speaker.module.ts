import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Speaker } from './entities/speaker.entity';
import { SpeakerService } from './speaker.service';
import { SpeakerController } from './speaker.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Speaker])],
  controllers: [SpeakerController],
  providers: [SpeakerService],
  exports: [SpeakerService],
})
export class SpeakerModule {}