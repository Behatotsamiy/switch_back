import { Controller, Get, Param, Req, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import * as path from 'path';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard } from '../_auth/guards/jwt-auth.guard';

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

  @Get(':id/download')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async download(@Param('id') id: string, @Res() res: Response) {
    const cert = await this.certificateService.findOne(id);
    const filePath = path.join(process.cwd(), 'storage', 'certificates', `${cert.certificateNumber}.pdf`);
    res.download(filePath, `certificate-${cert.certificateNumber}.pdf`);
  }
}