import { IsUUID, IsOptional, IsString, IsDateString, IsISO8601, IsBoolean, IsInt, Min } from 'class-validator';
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

  // ── Modo com horário ──────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: '2026-05-14T09:00:00Z' })
  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @ApiPropertyOptional({ example: '2026-05-14T11:00:00Z' })
  @IsOptional()
  @IsISO8601()
  endedAt?: string;

  // ── Modo só duração ───────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'true quando o lançamento é feito apenas com duração, sem horário' })
  @IsOptional()
  @IsBoolean()
  durationOnly?: boolean;

  @ApiPropertyOptional({ description: 'Duração em segundos (obrigatório quando durationOnly = true)', minimum: 60 })
  @IsOptional()
  @IsInt()
  @Min(60)
  durationSeconds?: number;
}
