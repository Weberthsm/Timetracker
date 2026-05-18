import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class UploadService {
    private prisma;
    private config;
    constructor(prisma: PrismaService, config: ConfigService);
    private filePath;
    private extractRelativePath;
    private deleteFileIfExists;
    uploadAvatar(file: Express.Multer.File, targetUserId: string, currentUser: JwtPayload): Promise<{
        avatarUrl: string;
    }>;
    removeAvatar(targetUserId: string, currentUser: JwtPayload): Promise<void>;
    uploadProjectLogo(file: Express.Multer.File, projectId: string, currentUser: JwtPayload): Promise<{
        logoUrl: string;
    }>;
    removeProjectLogo(projectId: string, currentUser: JwtPayload): Promise<void>;
}
