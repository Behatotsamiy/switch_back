import { Controller, Get, Param, Req, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import * as path from 'path';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';
import { RolesGuard } from '../_auth/guards/roles.guard';
import { UserRole } from '../user/entities/user.entity';
import { Roles } from '../_auth/decorators/roles.decorator';

@ApiTags('certificates')
@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  findMy(@Req() req) {
    return this.certificateService.findMyCertificates(req.user.id);
  }
@Get()
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
findAll() {
  return this.certificateService.findAll();
}
  @Get(':id/download')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async download(@Param('id') id: string, @Res() res: Response) {
    const cert = await this.certificateService.findOne(id);
    const filePath = path.join(process.cwd(), 'storage', 'certificates', `${cert.certificateNumber}.pdf`);
    res.download(filePath, `certificate-${cert.certificateNumber}.pdf`);
  }
}