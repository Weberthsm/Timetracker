import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { StartTimerDto } from './dto/start-timer.dto';
export declare class TimeEntriesService {
    private prisma;
    private eventEmitter;
    constructor(prisma: PrismaService, eventEmitter: EventEmitter2);
    private checkProjectAccess;
    private checkTaskStatus;
    create(dto: CreateTimeEntryDto, currentUser: JwtPayload): Promise<{
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
        startedAt: Date | null;
        endedAt: Date | null;
        durationOnly: boolean;
        duration: number | null;
    }>;
    findAll(filters: {
        userId?: string;
        date?: string;
        month?: string;
        projectId?: string;
        page?: number;
        limit?: number;
    }, currentUser: JwtPayload): Promise<{
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
            startedAt: Date | null;
            endedAt: Date | null;
            durationOnly: boolean;
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
    findOne(id: string, currentUser: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        description: string | null;
        userId: string;
        projectId: string;
        taskId: string | null;
        startedAt: Date | null;
        endedAt: Date | null;
        durationOnly: boolean;
        duration: number | null;
    }>;
    update(id: string, dto: UpdateTimeEntryDto, currentUser: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        description: string | null;
        userId: string;
        projectId: string;
        taskId: string | null;
        startedAt: Date | null;
        endedAt: Date | null;
        durationOnly: boolean;
        duration: number | null;
    }>;
    remove(id: string, currentUser: JwtPayload): Promise<void>;
    startTimer(dto: StartTimerDto, currentUser: JwtPayload): Promise<{
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
        startedAt: Date | null;
        endedAt: Date | null;
        durationOnly: boolean;
        duration: number | null;
    }>;
    stopTimer(id: string, currentUser: JwtPayload): Promise<{
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
        startedAt: Date | null;
        endedAt: Date | null;
        durationOnly: boolean;
        duration: number | null;
    }>;
    getActiveTimer(currentUser: JwtPayload): Promise<({
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
        startedAt: Date | null;
        endedAt: Date | null;
        durationOnly: boolean;
        duration: number | null;
    }) | null>;
}
