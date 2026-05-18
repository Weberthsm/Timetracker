import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({ example: 'joao@empresa.com' })
  @IsEmail()
  email!: string;
}
