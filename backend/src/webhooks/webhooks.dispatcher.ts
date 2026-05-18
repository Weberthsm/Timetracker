import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac } from 'crypto';

const RETRY_DELAYS_MS = [60_000, 300_000, 900_000];
const MAX_ATTEMPTS = 3;

@Injectable()
export class WebhooksDispatcher {
  constructor(private prisma: PrismaService) {}

  @OnEvent('time_entry.created')
  onTimeEntryCreated(payload: object) { void this.dispatch('time_entry.created', payload); }

  @OnEvent('time_entry.updated')
  onTimeEntryUpdated(payload: object) { void this.dispatch('time_entry.updated', payload); }

  @OnEvent('time_entry.deleted')
  onTimeEntryDeleted(payload: object) { void this.dispatch('time_entry.deleted', payload); }

  @OnEvent('timer.started')
  onTimerStarted(payload: object) { void this.dispatch('timer.started', payload); }

  @OnEvent('timer.stopped')
  onTimerStopped(payload: object) { void this.dispatch('timer.stopped', payload); }

  async dispatch(event: string, payload: object): Promise<void> {
    const destinations = await this.prisma.webhookDestination.findMany({
      where: { isActive: true },
    });

    const active = destinations.filter((d) => d.isActive && (d.events as string[]).includes(event));
    await Promise.allSettled(active.map((d) => this.sendToDestination(d, event, payload)));
  }

  async sendToDestination(
    destination: { id: string; url: string; secret: string | null },
    event: string,
    payload: object,
    attempt = 1,
  ) {
    const body = JSON.stringify({ event, occurredAt: new Date().toISOString(), data: payload });
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (destination.secret) {
      const sig = createHmac('sha256', destination.secret).update(body).digest('hex');
      headers['X-TimeTracker-Signature'] = `sha256=${sig}`;
    }

    let statusCode: number | null = null;
    let responseBody: string | null = null;
    let success = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch(destination.url, { method: 'POST', headers, body, signal: controller.signal });
      clearTimeout(timeout);
      statusCode = res.status;
      responseBody = await res.text().catch(() => null);
      success = res.ok;
    } catch {
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
}
