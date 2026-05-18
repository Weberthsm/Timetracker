import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Relatório diário de um usuário' })
  @ApiQuery({ name: 'date', required: true, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'userId', required: true })
  getDailyReport(
    @Query('date') date: string,
    @Query('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getDailyReport(date, userId, user);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Relatório mensal de um usuário' })
  @ApiQuery({ name: 'month', required: true, description: 'YYYY-MM' })
  @ApiQuery({ name: 'userId', required: true })
  getMonthlyReport(
    @Query('month') month: string,
    @Query('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getMonthlyReport(month, userId, user);
  }

  @Get('allocation')
  @ApiOperation({ summary: 'Alocação por equipe e colaborador (admin/manager)' })
  @ApiQuery({ name: 'granularity', required: true, enum: ['day', 'month', 'year'] })
  @ApiQuery({ name: 'value', required: true, description: 'YYYY-MM-DD | YYYY-MM | YYYY' })
  getAllocationReport(
    @Query('granularity') granularity: 'day' | 'month' | 'year',
    @Query('value') value: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getAllocationReport(granularity, value, user);
  }

  @Get('team')
  @ApiOperation({ summary: 'Relatório mensal da equipe (admin/manager)' })
  @ApiQuery({ name: 'teamId', required: true })
  @ApiQuery({ name: 'month', required: true, description: 'YYYY-MM' })
  getTeamReport(
    @Query('teamId') teamId: string,
    @Query('month') month: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reportsService.getTeamReport(teamId, month, user);
  }
}
