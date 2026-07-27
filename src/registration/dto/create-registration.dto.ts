// create-registration.dto.ts
import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRegistrationDto {
  @ApiProperty({ example: 'uuid события' })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;
}