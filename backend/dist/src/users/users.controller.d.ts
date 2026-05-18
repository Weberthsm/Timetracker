import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(page?: string, limit?: string, search?: string): Promise<{
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
    update(id: string, dto: UpdateUserDto, user: JwtPayload): Promise<{
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
    remove(id: string, user: JwtPayload): Promise<void>;
    updateRole(id: string, dto: UpdateRoleDto, user: JwtPayload): Promise<{
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
