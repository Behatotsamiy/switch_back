import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { Roles } from '../_auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { AttachSpeakerDto } from '../speaker/dto/attach-speaker.dto';

@ApiTags('events')
@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  findAll() {
    return this.eventService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateEventDto) {
    return this.eventService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventService.update(id, dto);
  }

  @Patch(':id/finish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  finish(@Param('id') id: string) {
    return this.eventService.finishEvent(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.eventService.remove(id);
  }
  @Post(':id/speakers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  attachSpeaker(@Param('id') id: string, @Body() dto: AttachSpeakerDto) {
    return this.eventService.attachSpeaker(id, dto.speakerId);
  }

  @Delete(':id/speakers/:speakerId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  detachSpeaker(
    @Param('id') id: string,
    @Param('speakerId') speakerId: string,
  ) {
    return this.eventService.detachSpeaker(id, speakerId);
  }
}
