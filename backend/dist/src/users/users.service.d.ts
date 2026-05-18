import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(filters?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        data: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            avatarUrl: string | null;
            emailVerifiedAt: Date | null;
            teamId: string | null;
            createdAt: Date;
            updatedAt: Date;
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
    findOne(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        avatarUrl: string | null;
        emailVerifiedAt: Date | null;
        teamId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateUserDto, currentUser: JwtPayload): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        avatarUrl: string | null;
        emailVerifiedAt: Date | null;
        teamId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, currentUser: JwtPayload): Promise<void>;
    updateRole(id: string, dto: UpdateRoleDto, currentUser: JwtPayload): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        avatarUrl: string | null;
        emailVerifiedAt: Date | null;
        teamId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
