import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhooksDispatcher } from './webhooks.dispatcher';
import { paginate } from '../common/utils/paginate';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private dispatcher: WebhooksDispatcher,
  ) {}

  private requireAdmin(currentUser: JwtPayload) {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('Apenas administradores podem gerenciar webhooks');
    }
  }

  async create(dto: CreateWebhookDto, currentUser: JwtPayload) {
    this.requireAdmin(currentUser);
    return this.prisma.webhookDestination.create({
      data: {
        name: dto.name,
        url: dto.url,
        secret: dto.secret,
        events: dto.events,
        isActive: dto.isActive ?? true,
        createdBy: currentUser.userId,
      },
    });
  }

  async findAll(currentUser: JwtPayload) {
    this.requireAdmin(currentUser);
    return this.prisma.webhookDestination.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string, currentUser: JwtPayload) {
    this.requireAdmin(currentUser);
    const webhook = await this.prisma.webhookDestination.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook não encontrado');
    return webhook;
  }

  async update(id: string, dto: UpdateWebhookDto, currentUser: JwtPayload) {
    this.requireAdmin(currentUser);
    const webhook = await this.prisma.webhookDestination.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook não encontrado');
    return this.prisma.webhookDestination.update({ where: { id }, data: dto as any });
  }

  async remove(id: string, currentUser: JwtPayload) {
    this.requireAdmin(currentUser);
    const webhook = await this.prisma.webhookDestination.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook não encontrado');
    await this.prisma.webhookDestination.delete({ where: { id } });
  }

  async testWebhook(id: string, currentUser: JwtPayload) {
    this.requireAdmin(currentUser);
    const webhook = await this.prisma.webhookDestination.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook não encontrado');

    return this.dispatcher.sendToDestination(webhook, 'test', { test: true, webhookId: id });
  }

  async getDeliveries(
    webhookId: string,
    currentUser: JwtPayload,
    filters: { page?: number; limit?: number } = {},
  ) {
    this.requireAdmin(currentUser);
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const where = { webhookDestinationId: webhookId };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.webhookDelivery.findMany({
        where,
        orderBy: { deliveredAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.webhookDelivery.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async retryDelivery(webhookId: string, deliveryId: string, currentUser: JwtPayload) {
    this.requireAdmin(currentUser);
    const delivery = await this.prisma.webhookDelivery.findUnique({ where: { id: deliveryId } });
    if (!delivery || delivery.webhookDestinationId !== webhookId) {
      throw new NotFoundException('Entrega não encontrada');
    }

    const webhook = await this.prisma.webhookDestination.findUnique({ where: { id: webhookId } });
    if (!webhook) throw new NotFoundException('Webhook não encontrado');

    const payload = delivery.payload as object;
    // delivery.event is the stored event name; payload is the original entity data
    return this.dispatcher.sendToDestination(webhook, delivery.event, payload);
  }
}
