import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { Roles } from '../_auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@ApiTags('registrations')
@Controller('registrations')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  register(@Req() req, @Body() dto: CreateRegistrationDto) {
    return this.registrationService.register(req.user.id, dto);
  }

  @Patch(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  cancel(@Req() req, @Param('id') id: string) {
    return this.registrationService.cancel(req.user.id, id);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findMy(@Req() req) {
    return this.registrationService.findMyRegistrations(req.user.id);
  }

  @Get('event/:eventId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findByEvent(@Param('eventId') eventId: string) {
    return this.registrationService.findByEvent(eventId);
  }

  @Patch('attendance')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  markAttendance(@Body() dto: MarkAttendanceDto) {
    return this.registrationService.markAttendance(dto.registrationId, dto.attended);
  }
}