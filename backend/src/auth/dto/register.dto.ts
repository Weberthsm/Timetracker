import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'joao@empresa.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senha1234', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
