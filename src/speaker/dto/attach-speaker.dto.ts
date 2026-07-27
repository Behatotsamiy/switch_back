// attach-speaker.dto.ts — для привязки спикера к event
import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AttachSpeakerDto {
  @ApiProperty({ example: 'uuid спикера' })
  @IsUUID()
  @IsNotEmpty()
  speakerId: string;
}