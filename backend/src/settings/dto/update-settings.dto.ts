import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireEmailVerification?: boolean;

  @ApiPropertyOptional({ description: 'Habilita modo Início/Fim no formulário de lançamento' })
  @IsOptional()
  @IsBoolean()
  allowTimesMode?: boolean;

  @ApiPropertyOptional({ description: 'Habilita modo Início + Duração no formulário de lançamento' })
  @IsOptional()
  @IsBoolean()
  allowStartDurationMode?: boolean;

  @ApiPropertyOptional({ description: 'Habilita modo Só Duração no formulário de lançamento' })
  @IsOptional()
  @IsBoolean()
  allowDurationOnlyMode?: boolean;
}
