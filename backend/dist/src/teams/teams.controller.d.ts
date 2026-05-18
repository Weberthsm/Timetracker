import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class TeamsController {
    private teamsService;
    constructor(teamsService: TeamsService);
    findAll(page?: string, limit?: string): Promise<{
        data: ({
            _count: {
                members: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    create(dto: CreateTeamDto, user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
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
    update(id: string, dto: UpdateTeamDto, user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string, user: JwtPayload): Promise<void>;
    addMember(id: string, dto: AddMemberDto, user: JwtPayload): Promise<{
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
    removeMember(id: string, userId: string, user: JwtPayload): Promise<void>;
}
