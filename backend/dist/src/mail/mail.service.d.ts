import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class MailService implements OnModuleInit {
    private config;
    private transporter;
    constructor(config: ConfigService);
    onModuleInit(): void;
    sendEmailVerification(to: string, name: string, token: string): Promise<void>;
    sendPasswordReset(to: string, name: string, token: string): Promise<void>;
}
