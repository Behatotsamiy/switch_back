import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { RejectPaymentDto } from './dto/reject-payment.dto';
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

  @Get(':id/ticket')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getTicket(@Req() req, @Param('id') id: string) {
    return this.registrationService.getTicketData(req.user.id, id);
  }

  @Get(':id/ticket/download')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async downloadTicket(@Req() req, @Param('id') id: string, @Res() res: Response) {
    const filePath = await this.registrationService.downloadTicketPdf(req.user.id, id);
    res.download(filePath, 'switch-ticket.pdf');
  }

  // ─── Оплата (пользователь) ──────────────────────────────────────

  @Post(':id/receipt')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './storage/receipts',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|pdf)$/)) {
          return cb(new BadRequestException('Разрешены только изображения или PDF'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  uploadReceipt(@Req() req, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Файл не был загружен');
    return this.registrationService.uploadReceipt(req.user.id, id, file);
  }

  // ─── Оплата (админ) ──────────────────────────────────────────────

  @Get('pending-payments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findPendingPayments() {
    return this.registrationService.findPendingPayments();
  }

  @Patch(':id/approve-payment')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  approvePayment(@Param('id') id: string) {
    return this.registrationService.approvePayment(id);
  }

  @Patch(':id/reject-payment')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  rejectPayment(@Param('id') id: string, @Body() dto: RejectPaymentDto) {
    return this.registrationService.rejectPayment(id, dto.reason);
  }
  @Get(':id/receipt')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
async viewReceipt(@Param('id') id: string, @Res() res: Response) {
  return this.registrationService.streamReceipt(id, res);
}

  // ─── Прочее ────────────────────────────────────────────────────

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

  @Post('check-in')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  checkIn(@Body() dto: CheckInDto) {
    return this.registrationService.checkIn(dto.ticketNumber, dto.eventId);
  }
}