import { ReportsService } from './reports.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    getDailyReport(date: string, userId: string, user: JwtPayload): Promise<{
        date: string;
        totalSeconds: number;
        totalFormatted: string;
        byProject: {
            percentage: number;
            totalFormatted: string;
            projectId: string;
            projectName: string;
            color: string | null;
            totalSeconds: number;
        }[];
        entries: {
            id: string;
            description: string | null;
            startedAt: Date;
            endedAt: Date | null;
            duration: number | null;
            durationFormatted: string;
            project: {
                id: string;
                name: string;
                color: string | null;
            };
            task: {
                id: string;
                title: string;
            } | null;
        }[];
    }>;
    getMonthlyReport(month: string, userId: string, user: JwtPayload): Promise<{
        month: string;
        totalSeconds: number;
        totalFormatted: string;
        byProject: {
            percentage: number;
            totalFormatted: string;
            projectId: string;
            projectName: string;
            color: string | null;
            totalSeconds: number;
        }[];
        byDay: {
            date: string;
            totalSeconds: number;
            totalFormatted: string;
        }[];
    }>;
    getAllocationReport(granularity: 'day' | 'month' | 'year', value: string, user: JwtPayload): Promise<{
        granularity: "year" | "day" | "month";
        value: string;
        teams: {
            teamId: string;
            teamName: string;
            totalSeconds: number;
            totalFormatted: string;
            byProject: {
                percentage: number;
                totalFormatted: string;
                projectId: string;
                projectName: string;
                color: string | null;
                totalSeconds: number;
            }[];
        }[];
        members: {
            member: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
                teamId: string | null;
                teamName: string | null;
            };
            totalSeconds: number;
            totalFormatted: string;
            byProject: {
                percentage: number;
                totalFormatted: string;
                projectId: string;
                projectName: string;
                color: string | null;
                totalSeconds: number;
            }[];
        }[];
    }>;
    getTeamReport(teamId: string, month: string, user: JwtPayload): Promise<{
        teamId: string;
        month: string;
        members: {
            member: {
                id: string;
                name: string;
                email: string;
                avatarUrl: string | null;
            };
            totalSeconds: number;
            totalFormatted: string;
            byProject: {
                projectId: string;
                projectName: string;
                totalSeconds: number;
            }[];
        }[];
    }>;
}
