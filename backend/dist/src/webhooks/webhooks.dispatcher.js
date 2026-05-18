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
exports.WebhooksDispatcher = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000];
const MAX_ATTEMPTS = 3;
let WebhooksDispatcher = class WebhooksDispatcher {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    onTimeEntryCreated(payload) { void this.dispatch('time_entry.created', payload); }
    onTimeEntryUpdated(payload) { void this.dispatch('time_entry.updated', payload); }
    onTimeEntryDeleted(payload) { void this.dispatch('time_entry.deleted', payload); }
    onTimerStarted(payload) { void this.dispatch('timer.started', payload); }
    onTimerStopped(payload) { void this.dispatch('timer.stopped', payload); }
    async dispatch(event, payload) {
        const destinations = await this.prisma.webhookDestination.findMany({
            where: { isActive: true },
        });
        const active = destinations.filter((d) => d.isActive && d.events.includes(event));
        await Promise.allSettled(active.map((d) => this.sendToDestination(d, event, payload)));
    }
    async sendToDestination(destination, event, payload, attempt = 1) {
        const body = JSON.stringify({ event, occurredAt: new Date().toISOString(), data: payload });
        const headers = { 'Content-Type': 'application/json' };
        if (destination.secret) {
            const sig = (0, crypto_1.createHmac)('sha256', destination.secret).update(body).digest('hex');
            headers['X-TimeTracker-Signature'] = `sha256=${sig}`;
        }
        let statusCode = null;
        let responseBody = null;
        let success = false;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10_000);
            const res = await fetch(destination.url, { method: 'POST', headers, body, signal: controller.signal });
            clearTimeout(timeout);
            statusCode = res.status;
            responseBody = await res.text().catch(() => null);
            success = res.ok;
        }
        catch {
            success = false;
        }
        const delivery = await this.prisma.webhookDelivery.create({
            data: {
                webhookDestinationId: destination.id,
                event,
                payload,
                statusCode,
                responseBody,
                attempt,
                success,
            },
        });
        if (!success && attempt < MAX_ATTEMPTS) {
            const delay = RETRY_DELAYS_MS[attempt - 1];
            setTimeout(() => {
                void this.sendToDestination(destination, event, payload, attempt + 1);
            }, delay);
        }
        return delivery;
    }
};
exports.WebhooksDispatcher = WebhooksDispatcher;
__decorate([
    (0, event_emitter_1.OnEvent)('time_entry.created'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebhooksDispatcher.prototype, "onTimeEntryCreated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('time_entry.updated'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebhooksDispatcher.prototype, "onTimeEntryUpdated", null);
__decorate([
    (0, event_emitter_1.OnEvent)('time_entry.deleted'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebhooksDispatcher.prototype, "onTimeEntryDeleted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('timer.started'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebhooksDispatcher.prototype, "onTimerStarted", null);
__decorate([
    (0, event_emitter_1.OnEvent)('timer.stopped'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WebhooksDispatcher.prototype, "onTimerStopped", null);
exports.WebhooksDispatcher = WebhooksDispatcher = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WebhooksDispatcher);
//# sourceMappingURL=webhooks.dispatcher.js.map