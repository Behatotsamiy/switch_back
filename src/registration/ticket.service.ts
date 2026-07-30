import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { Registration } from './entities/registration.entity';

@Injectable()
export class TicketService {
  generateTicketNumber(): string {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `SW-TCK-${random}`;
  }

  // QR кодирует не сами данные билета, а просто ticketNumber —
  // при сканировании админ бьёт запросом на бэкенд и получает актуальные данные,
  // а не то, что было "зашито" в момент генерации (защита от подделки/устаревания)
  async generateQrDataUrl(registration: Registration): Promise<string> {
    const payload = JSON.stringify({
      ticket: registration.ticketNumber,
      eventId: registration.eventId,
    });
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 400,
      color: { dark: '#1c0940', light: '#ffffff' },
    });
  }
}