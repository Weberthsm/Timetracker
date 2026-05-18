import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';
export declare class SettingsService {
    private prisma;
    constructor(prisma: PrismaService);
    getSettings(): Promise<{
        id: number;
        updatedAt: Date;
        requireEmailVerification: boolean;
        updatedBy: string | null;
    }>;
    updateSettings(dto: UpdateSettingsDto, currentUser: JwtPayload): Promise<{
        id: number;
        updatedAt: Date;
        requireEmailVerification: boolean;
        updatedBy: string | null;
    }>;
}
