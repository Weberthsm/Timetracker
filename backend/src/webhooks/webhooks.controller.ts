import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('webhooks')
@ApiBearerAuth()
@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar webhook (admin)' })
  create(@Body() dto: CreateWebhookDto, @CurrentUser() user: JwtPayload) {
    return this.webhooksService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar webhooks (admin)' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.webhooksService.findAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar webhook por ID (admin)' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.webhooksService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar webhook (admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateWebhookDto, @CurrentUser() user: JwtPayload) {
    return this.webhooksService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover webhook (admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.webhooksService.remove(id, user);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Testar webhook (admin)' })
  testWebhook(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.webhooksService.testWebhook(id, user);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Listar entregas de um webhook (admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getDeliveries(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.webhooksService.getDeliveries(id, user, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Post(':id/deliveries/:did/retry')
  @ApiOperation({ summary: 'Reenviar entrega (admin)' })
  retryDelivery(@Param('id') id: string, @Param('did') did: string, @CurrentUser() user: JwtPayload) {
    return this.webhooksService.retryDelivery(id, did, user);
  }
}
