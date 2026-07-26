import {
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  MinLength,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber() // Проверит формат номера
  phone: string;

  @ApiProperty({ example: 'JohnDoe@email.com' })
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '12345678' })
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  password: string;

  @ApiProperty({ example: 'Alisher' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Usmanov' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.GUEST })
  @IsEnum(UserRole)
  role: UserRole;
}
