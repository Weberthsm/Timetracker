import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class WebhooksController {
    private webhooksService;
    constructor(webhooksService: WebhooksService);
    create(dto: CreateWebhookDto, user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        secret: string | null;
        events: string[];
        isActive: boolean;
        createdBy: string;
    }>;
    findAll(user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        secret: string | null;
        events: string[];
        isActive: boolean;
        createdBy: string;
    }[]>;
    findOne(id: string, user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        secret: string | null;
        events: string[];
        isActive: boolean;
        createdBy: string;
    }>;
    update(id: string, dto: UpdateWebhookDto, user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        url: string;
        secret: string | null;
        events: string[];
        isActive: boolean;
        createdBy: string;
    }>;
    remove(id: string, user: JwtPayload): Promise<void>;
    testWebhook(id: string, user: JwtPayload): Promise<{
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
    getDeliveries(id: string, user: JwtPayload, page?: string, limit?: string): Promise<{
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
    retryDelivery(id: string, did: string, user: JwtPayload): Promise<{
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
