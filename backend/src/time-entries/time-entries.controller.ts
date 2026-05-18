import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('time-entries')
@ApiBearerAuth()
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private timeEntriesService: TimeEntriesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Retornar timer ativo do usuário' })
  getActive(@CurrentUser() user: JwtPayload) {
    return this.timeEntriesService.getActiveTimer(user);
  }

  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar timer' })
  startTimer(@Body() dto: StartTimerDto, @CurrentUser() user: JwtPayload) {
    return this.timeEntriesService.startTimer(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar lançamentos' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('userId') userId?: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('projectId') projectId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.timeEntriesService.findAll(
      { userId, date, month, projectId, page: page ? parseInt(page, 10) : 1, limit: limit ? parseInt(limit, 10) : 20 },
      user,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar lançamento manual' })
  create(@Body() dto: CreateTimeEntryDto, @CurrentUser() user: JwtPayload) {
    return this.timeEntriesService.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar lançamento por ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.timeEntriesService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar lançamento' })
  update(@Param('id') id: string, @Body() dto: UpdateTimeEntryDto, @CurrentUser() user: JwtPayload) {
    return this.timeEntriesService.update(id, dto, user);
  }

  @Patch(':id/stop')
  @ApiOperation({ summary: 'Parar timer' })
  stopTimer(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.timeEntriesService.stopTimer(id, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir lançamento' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.timeEntriesService.remove(id, user);
  }
}
