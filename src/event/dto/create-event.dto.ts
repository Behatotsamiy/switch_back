// create-event.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Women in Tech Meetup' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Встреча девушек в IT, обсуждаем карьеру и проекты' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Tashkent, IT Park' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: '2026-08-15T14:00:00.000Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-08-15T17:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxParticipants?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  coverImage?: string;
}