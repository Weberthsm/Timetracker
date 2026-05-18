import { IsString, IsUrl, IsOptional, IsBoolean, IsArray, ArrayMinSize, MinLength, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_EVENTS = [
  'time_entry.created',
  'time_entry.updated',
  'time_entry.deleted',
  'timer.started',
  'timer.stopped',
  'report.daily',
  'report.monthly',
];

export class CreateWebhookDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @ApiProperty()
  @IsUrl()
  url!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secret?: string;

  @ApiProperty({ isArray: true, enum: VALID_EVENTS })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(VALID_EVENTS, { each: true })
  events!: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
