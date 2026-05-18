"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const webhooks_dispatcher_1 = require("./webhooks.dispatcher");
const paginate_1 = require("../common/utils/paginate");
let WebhooksService = class WebhooksService {
    prisma;
    dispatcher;
    constructor(prisma, dispatcher) {
        this.prisma = prisma;
        this.dispatcher = dispatcher;
    }
    requireAdmin(currentUser) {
        if (currentUser.role !== 'admin') {
            throw new common_1.ForbiddenException('Apenas administradores podem gerenciar webhooks');
        }
    }
    async create(dto, currentUser) {
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
    async findAll(currentUser) {
        this.requireAdmin(currentUser);
        return this.prisma.webhookDestination.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async findOne(id, currentUser) {
        this.requireAdmin(currentUser);
        const webhook = await this.prisma.webhookDestination.findUnique({ where: { id } });
        if (!webhook)
            throw new common_1.NotFoundException('Webhook não encontrado');
        return webhook;
    }
    async update(id, dto, currentUser) {
        this.requireAdmin(currentUser);
        const webhook = await this.prisma.webhookDestination.findUnique({ where: { id } });
        if (!webhook)
            throw new common_1.NotFoundException('Webhook não encontrado');
        return this.prisma.webhookDestination.update({ where: { id }, data: dto });
    }
    async remove(id, currentUser) {
        this.requireAdmin(currentUser);
        const webhook = await this.prisma.webhookDestination.findUnique({ where: { id } });
        if (!webhook)
            throw new common_1.NotFoundException('Webhook não encontrado');
        await this.prisma.webhookDestination.delete({ where: { id } });
    }
    async testWebhook(id, currentUser) {
        this.requireAdmin(currentUser);
        const webhook = await this.prisma.webhookDestination.findUnique({ where: { id } });
        if (!webhook)
            throw new common_1.NotFoundException('Webhook não encontrado');
        return this.dispatcher.sendToDestination(webhook, 'test', { test: true, webhookId: id });
    }
    async getDeliveries(webhookId, currentUser, filters = {}) {
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
        return (0, paginate_1.paginate)(data, total, page, limit);
    }
    async retryDelivery(webhookId, deliveryId, currentUser) {
        this.requireAdmin(currentUser);
        const delivery = await this.prisma.webhookDelivery.findUnique({ where: { id: deliveryId } });
        if (!delivery || delivery.webhookDestinationId !== webhookId) {
            throw new common_1.NotFoundException('Entrega não encontrada');
        }
        const webhook = await this.prisma.webhookDestination.findUnique({ where: { id: webhookId } });
        if (!webhook)
            throw new common_1.NotFoundException('Webhook não encontrado');
        const payload = delivery.payload;
        return this.dispatcher.sendToDestination(webhook, delivery.event, payload);
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        webhooks_dispatcher_1.WebhooksDispatcher])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map