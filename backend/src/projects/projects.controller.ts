import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar projetos' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'archived', 'all'] })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.projectsService.findAll(user, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectsService.create(dto, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.projectsService.findOne(id); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: JwtPayload) {
    return this.projectsService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  archive(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.archive(id, user);
  }

  @Post(':id/teams/:teamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  linkTeam(@Param('id') id: string, @Param('teamId') teamId: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.linkTeam(id, teamId, user);
  }

  @Delete(':id/teams/:teamId')
  @HttpCode(HttpStatus.NO_CONTENT)
  unlinkTeam(@Param('id') id: string, @Param('teamId') teamId: string, @CurrentUser() user: JwtPayload) {
    return this.projectsService.unlinkTeam(id, teamId, user);
  }
}
