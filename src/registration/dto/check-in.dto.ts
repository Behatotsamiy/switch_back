import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckInDto {
  @ApiProperty({ example: 'SW-TCK-A1B2C3' })
  @IsString()
  @IsNotEmpty()
  ticketNumber: string;

  @ApiProperty({ example: 'uuid события' })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;
}