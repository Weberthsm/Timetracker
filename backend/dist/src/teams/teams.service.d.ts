import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
export declare class TeamsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTeamDto, currentUser: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(filters?: {
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            membersCount: number;
            id: string;
            name: string;
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
        members: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            avatarUrl: string | null;
        }[];
        teamProjects: ({
            project: {
                id: string;
                name: string;
                color: string | null;
            };
        } & {
            teamId: string;
            projectId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateTeamDto, currentUser: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, currentUser: JwtPayload): Promise<void>;
    addMember(teamId: string, dto: AddMemberDto, currentUser: JwtPayload): Promise<{
        members: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            avatarUrl: string | null;
        }[];
        teamProjects: ({
            project: {
                id: string;
                name: string;
                color: string | null;
            };
        } & {
            teamId: string;
            projectId: string;
        })[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    removeMember(teamId: string, userId: string, currentUser: JwtPayload): Promise<void>;
}
