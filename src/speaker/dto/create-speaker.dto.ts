// create-speaker.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSpeakerDto {
  @ApiProperty({ example: 'Zilola' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Rakhimova' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Frontend developer, 5 лет опыта в IT', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiProperty({ example: 'Frontend Developer at Epam', required: false })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  linkedin?: string;
}