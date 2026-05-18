import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Mobile Team' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;
}
