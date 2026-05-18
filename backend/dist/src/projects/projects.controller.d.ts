import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class ProjectsController {
    private projectsService;
    constructor(projectsService: ProjectsService);
    findAll(user: JwtPayload, page?: string, limit?: string, status?: string): Promise<{
        data: ({
            _count: {
                timeEntries: number;
                tasks: number;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            color: string | null;
            logoUrl: string | null;
            status: import("@prisma/client").$Enums.ProjectStatus;
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
    create(dto: CreateProjectDto, user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        color: string | null;
        logoUrl: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
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
    update(id: string, dto: UpdateProjectDto, user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        color: string | null;
        logoUrl: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    archive(id: string, user: JwtPayload): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        color: string | null;
        logoUrl: string | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
    }>;
    linkTeam(id: string, teamId: string, user: JwtPayload): Promise<void>;
    unlinkTeam(id: string, teamId: string, user: JwtPayload): Promise<void>;
}
