import { IsUUID, IsOptional, IsString, IsDateString, IsISO8601 } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTimeEntryDto {
  @ApiProperty()
  @IsUUID()
  projectId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-05-14' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '2026-05-14T09:00:00Z' })
  @IsISO8601()
  startedAt!: string;

  @ApiProperty({ example: '2026-05-14T11:00:00Z' })
  @IsISO8601()
  endedAt!: string;
}
