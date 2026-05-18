import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
export declare class TasksService {
    private prisma;
    constructor(prisma: PrismaService);
    private checkProjectAccess;
    create(projectId: string, dto: CreateTaskDto, currentUser: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        projectId: string;
    }>;
    findAll(projectId: string, currentUser: JwtPayload, filters?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            projectId: string;
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
    findOne(projectId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        projectId: string;
    }>;
    update(projectId: string, id: string, dto: UpdateTaskDto, currentUser: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        projectId: string;
    }>;
    remove(projectId: string, id: string, currentUser: JwtPayload): Promise<void>;
}
