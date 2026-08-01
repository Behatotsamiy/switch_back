import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Certificate } from './entities/certificate.entity';
import {
  Registration,
  RegistrationStatus,
} from '../registration/entities/registration.entity';
import { getCertificateHtml } from './templates/certificate-template';

@Injectable()
export class CertificateService {
  private readonly logger = new Logger(CertificateService.name);
  private readonly storageDir = path.join(
    process.cwd(),
    'storage',
    'certificates',
  );

  constructor(
    @InjectRepository(Certificate)
    private readonly certificateRepo: Repository<Certificate>,
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
  ) {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  // вызывается из EventService.finishEvent()
  async findAll(): Promise<Certificate[]> {
  return this.certificateRepo.find({
    relations: { user: true, event: true },
    order: { issuedAt: 'DESC' },
  });
}
  async generateForEvent(eventId: string): Promise<void> {
    const registrations = await this.registrationRepo.find({
      where: { eventId, status: RegistrationStatus.ACTIVE, attended: true },
      relations: {
        user: true,
        event: true,
      },
    });

    if (registrations.length === 0) {
      this.logger.log(
        `No attended participants for event ${eventId}, skipping certificates`,
      );
      return;
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      for (const reg of registrations) {
        await this.generateOne(browser, reg);
      }
    } finally {
      await browser.close();
    }
  }

  private async generateOne(
    browser: puppeteer.Browser,
    reg: Registration,
  ): Promise<void> {
    const existing = await this.certificateRepo.findOne({
      where: { userId: reg.userId, eventId: reg.eventId },
    });
    if (existing) return; // уже выдан, не дублируем

    const certificateNumber = this.buildCertificateNumber();
    const html = getCertificateHtml({
      fullName: `${reg.user.firstName} ${reg.user.lastName}`,
      eventTitle: reg.event.title,
      eventDate: new Date(reg.event.startDate).toLocaleDateString('ru-RU'),
      certificateNumber,
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
    });
    await page.waitForNetworkIdle();

    const fileName = `${certificateNumber}.pdf`;
    const filePath = path.join(this.storageDir, fileName);

    await page.pdf({
      path: filePath,
      width: '1123px',
      height: '794px',
      printBackground: true,
    });
    await page.close();

    const certificate = this.certificateRepo.create({
      userId: reg.userId,
      eventId: reg.eventId,
      certificateNumber,
      fileUrl: `/certificates/${fileName}`, // отдавать статикой или через отдельный endpoint
    });
    await this.certificateRepo.save(certificate);
  }

  private buildCertificateNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `SW-${year}-${random}`;
  }

  async findMyCertificates(userId: string): Promise<Certificate[]> {
    return this.certificateRepo.find({
      where: { userId },
      relations: {
        event: true,
      },
      order: { issuedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Certificate> {
    const cert = await this.certificateRepo.findOne({ where: { id } });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }
}
