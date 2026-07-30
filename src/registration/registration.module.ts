import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Registration } from './entities/registration.entity';
import { Event } from '../event/entities/event.entity';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { TicketService } from './ticket.service';

@Module({
  imports: [TypeOrmModule.forFeature([Registration, Event])],
  controllers: [RegistrationController],
  providers: [RegistrationService, TicketService],
  exports: [RegistrationService],
})
export class RegistrationModule {}