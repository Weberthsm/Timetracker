import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class SettingsController {
    private settingsService;
    constructor(settingsService: SettingsService);
    getSettings(user: JwtPayload): Promise<{
        id: number;
        updatedAt: Date;
        requireEmailVerification: boolean;
        updatedBy: string | null;
    }>;
    updateSettings(dto: UpdateSettingsDto, user: JwtPayload): Promise<{
        id: number;
        updatedAt: Date;
        requireEmailVerification: boolean;
        updatedBy: string | null;
    }>;
}
