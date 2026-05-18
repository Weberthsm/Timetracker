import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksDispatcher {
    private prisma;
    constructor(prisma: PrismaService);
    onTimeEntryCreated(payload: object): void;
    onTimeEntryUpdated(payload: object): void;
    onTimeEntryDeleted(payload: object): void;
    onTimerStarted(payload: object): void;
    onTimerStopped(payload: object): void;
    dispatch(event: string, payload: object): Promise<void>;
    sendToDestination(destination: {
        id: string;
        url: string;
        secret: string | null;
    }, event: string, payload: object, attempt?: number): Promise<{
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
