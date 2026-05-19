import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
export declare class ProjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateProjectDto, currentUser: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        color: string | null;
        logoUrl: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    findAll(currentUser: JwtPayload, filters?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        data: {
            tasksCount: number;
            timeEntriesCount: number;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            color: string | null;
            logoUrl: string | null;
            status: import("@prisma/client").$Enums.ProjectStatus;
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
        teamProjects: ({
            team: {
                id: string;
                name: string;
            };
        } & {
            teamId: string;
            projectId: string;
        })[];
        tasks: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            projectId: string;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        color: string | null;
        logoUrl: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    update(id: string, dto: UpdateProjectDto, currentUser: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        color: string | null;
        logoUrl: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    archive(id: string, currentUser: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        color: string | null;
        logoUrl: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    linkTeam(projectId: string, teamId: string, currentUser: JwtPayload): Promise<void>;
    unlinkTeam(projectId: string, teamId: string, currentUser: JwtPayload): Promise<void>;
}
