import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar equipes' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.teamsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar equipe' })
  create(@Body() dto: CreateTeamDto, @CurrentUser() user: JwtPayload) {
    return this.teamsService.create(dto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar equipe por ID' })
  findOne(@Param('id') id: string) { return this.teamsService.findOne(id); }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar equipe' })
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto, @CurrentUser() user: JwtPayload) {
    return this.teamsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir equipe' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.teamsService.remove(id, user);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Adicionar membro à equipe' })
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto, @CurrentUser() user: JwtPayload) {
    return this.teamsService.addMember(id, dto, user);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover membro da equipe' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @CurrentUser() user: JwtPayload) {
    return this.teamsService.removeMember(id, userId, user);
  }
}
