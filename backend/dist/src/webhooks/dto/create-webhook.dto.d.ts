export declare class CreateWebhookDto {
    name: string;
    url: string;
    secret?: string;
    events: string[];
    isActive?: boolean;
}
