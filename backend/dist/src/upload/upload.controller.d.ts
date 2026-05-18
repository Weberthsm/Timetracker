import { UploadService } from './upload.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class UploadController {
    private uploadService;
    constructor(uploadService: UploadService);
    uploadAvatar(file: Express.Multer.File, userId: string, user: JwtPayload): Promise<{
        avatarUrl: string;
    }>;
    removeAvatar(userId: string, user: JwtPayload): Promise<void>;
    uploadProjectLogo(file: Express.Multer.File, id: string, user: JwtPayload): Promise<{
        logoUrl: string;
    }>;
    removeProjectLogo(id: string, user: JwtPayload): Promise<void>;
}
