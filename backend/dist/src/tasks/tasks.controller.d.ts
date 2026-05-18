import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class TasksController {
    private tasksService;
    constructor(tasksService: TasksService);
    findAll(projectId: string, user: JwtPayload, page?: string, limit?: string, status?: string): Promise<{
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
    create(projectId: string, dto: CreateTaskDto, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        projectId: string;
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
    update(projectId: string, id: string, dto: UpdateTaskDto, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        status: import("@prisma/client").$Enums.TaskStatus;
        projectId: string;
    }>;
    remove(projectId: string, id: string, user: JwtPayload): Promise<void>;
}
