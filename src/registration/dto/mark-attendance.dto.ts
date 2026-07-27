// mark-attendance.dto.ts — для админа, отмечать явку
import { IsUUID, IsNotEmpty, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarkAttendanceDto {
  @ApiProperty({ example: 'uuid регистрации' })
  @IsUUID()
  @IsNotEmpty()
  registrationId: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  attended: boolean;
}