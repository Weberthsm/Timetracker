import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { StartTimerDto } from './dto/start-timer.dto';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class TimeEntriesController {
    private timeEntriesService;
    constructor(timeEntriesService: TimeEntriesService);
    getActive(user: JwtPayload): Promise<({
        project: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            color: string | null;
            logoUrl: string | null;
            status: import("@prisma/client").$Enums.ProjectStatus;
        };
        task: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            projectId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        description: string | null;
        userId: string;
        projectId: string;
        taskId: string | null;
        startedAt: Date;
        endedAt: Date | null;
        duration: number | null;
    }) | null>;
    startTimer(dto: StartTimerDto, user: JwtPayload): Promise<{
        project: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            color: string | null;
            logoUrl: string | null;
            status: import("@prisma/client").$Enums.ProjectStatus;
        };
        task: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            projectId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        description: string | null;
        userId: string;
        projectId: string;
        taskId: string | null;
        startedAt: Date;
        endedAt: Date | null;
        duration: number | null;
    }>;
    findAll(user: JwtPayload, userId?: string, date?: string, month?: string, projectId?: string, page?: string, limit?: string): Promise<{
        data: ({
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
            project: {
                id: string;
                name: string;
                color: string | null;
            };
            task: {
                id: string;
                title: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            date: Date;
            description: string | null;
            userId: string;
            projectId: string;
            taskId: string | null;
            startedAt: Date;
            endedAt: Date | null;
            duration: number | null;
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
    create(dto: CreateTimeEntryDto, user: JwtPayload): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
        };
        project: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            color: string | null;
            logoUrl: string | null;
            status: import("@prisma/client").$Enums.ProjectStatus;
        };
        task: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            projectId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        description: string | null;
        userId: string;
        projectId: string;
        taskId: string | null;
        startedAt: Date;
        endedAt: Date | null;
        duration: number | null;
    }>;
    findOne(id: string, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        description: string | null;
        userId: string;
        projectId: string;
        taskId: string | null;
        startedAt: Date;
        endedAt: Date | null;
        duration: number | null;
    }>;
    update(id: string, dto: UpdateTimeEntryDto, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        description: string | null;
        userId: string;
        projectId: string;
        taskId: string | null;
        startedAt: Date;
        endedAt: Date | null;
        duration: number | null;
    }>;
    stopTimer(id: string, user: JwtPayload): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
        };
        project: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            color: string | null;
            logoUrl: string | null;
            status: import("@prisma/client").$Enums.ProjectStatus;
        };
        task: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            status: import("@prisma/client").$Enums.TaskStatus;
            projectId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        description: string | null;
        userId: string;
        projectId: string;
        taskId: string | null;
        startedAt: Date;
        endedAt: Date | null;
        duration: number | null;
    }>;
    remove(id: string, user: JwtPayload): Promise<void>;
}
