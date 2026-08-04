import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectPaymentDto {
  @ApiProperty({ required: false, example: 'Сумма перевода не совпадает' })
  @IsOptional()
  @IsString()
  reason?: string;
}