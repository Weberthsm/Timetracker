import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { WebhooksDispatcher } from './webhooks.dispatcher';
export declare class WebhooksService {
    private prisma;
    private dispatcher;
    constructor(prisma: PrismaService, dispatcher: WebhooksDispatcher);
    private requireAdmin;
    create(dto: CreateWebhookDto, currentUser: JwtPayload): Promise<{
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        secret: string | null;
        events: string[];
        isActive: boolean;
        createdBy: string;
    }>;
    findAll(currentUser: JwtPayload): Promise<{
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        secret: string | null;
        events: string[];
        isActive: boolean;
        createdBy: string;
    }[]>;
    findOne(id: string, currentUser: JwtPayload): Promise<{
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        secret: string | null;
        events: string[];
        isActive: boolean;
        createdBy: string;
    }>;
    update(id: string, dto: UpdateWebhookDto, currentUser: JwtPayload): Promise<{
        url: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        secret: string | null;
        events: string[];
        isActive: boolean;
        createdBy: string;
    }>;
    remove(id: string, currentUser: JwtPayload): Promise<void>;
    testWebhook(id: string, currentUser: JwtPayload): Promise<{
        id: string;
        event: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        statusCode: number | null;
        responseBody: string | null;
        attempt: number;
        success: boolean;
        deliveredAt: Date;
        webhookDestinationId: string;
    }>;
    getDeliveries(webhookId: string, currentUser: JwtPayload, filters?: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            id: string;
            event: string;
            payload: import("@prisma/client/runtime/client").JsonValue;
            statusCode: number | null;
            responseBody: string | null;
            attempt: number;
            success: boolean;
            deliveredAt: Date;
            webhookDestinationId: string;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    retryDelivery(webhookId: string, deliveryId: string, currentUser: JwtPayload): Promise<{
        id: string;
        event: string;
        payload: import("@prisma/client/runtime/client").JsonValue;
        statusCode: number | null;
        responseBody: string | null;
        attempt: number;
        success: boolean;
        deliveredAt: Date;
        webhookDestinationId: string;
    }>;
}
