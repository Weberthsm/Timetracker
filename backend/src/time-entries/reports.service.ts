import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from '../common/decorators/current-user.decorator';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${m}min`;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDailyReport(date: string, userId: string, currentUser: JwtPayload) {
    if (currentUser.role === 'member' && userId !== currentUser.userId) {
      throw new ForbiddenException('Acesso não permitido');
    }

    const targetDate = new Date(date);
    const entries = await this.prisma.timeEntry.findMany({
      where: { userId, date: targetDate, endedAt: { not: null } },
      include: { project: { select: { id: true, name: true, color: true } }, task: { select: { id: true, title: true } } },
      orderBy: { startedAt: 'asc' },
    });

    const totalDaySeconds = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);
    const byProject = new Map<string, { projectId: string; projectName: string; color: string | null; totalSeconds: number }>();

    for (const e of entries) {
      const key = e.projectId;
      const existing = byProject.get(key) ?? {
        projectId: e.project.id,
        projectName: e.project.name,
        color: e.project.color,
        totalSeconds: 0,
      };
      existing.totalSeconds += e.duration ?? 0;
      byProject.set(key, existing);
    }

    return {
      date,
      totalSeconds: totalDaySeconds,
      totalFormatted: formatDuration(totalDaySeconds),
      byProject: Array.from(byProject.values()).map((p) => ({
        ...p,
        percentage: totalDaySeconds > 0 ? Math.round((p.totalSeconds / totalDaySeconds) * 1000) / 10 : 0,
        totalFormatted: formatDuration(p.totalSeconds),
      })),
      entries: entries.map((e) => ({
        id: e.id,
        description: e.description,
        startedAt: e.startedAt,
        endedAt: e.endedAt,
        duration: e.duration,
        durationFormatted: formatDuration(e.duration ?? 0),
        project: e.project,
        task: e.task,
      })),
    };
  }

  async getMonthlyReport(month: string, userId: string, currentUser: JwtPayload) {
    if (currentUser.role === 'member' && userId !== currentUser.userId) {
      throw new ForbiddenException('Acesso não permitido');
    }

    const [year, mon] = month.split('-').map(Number);
    const firstDay = new Date(year, mon - 1, 1);
    const lastDay = new Date(year, mon, 0);

    const entries = await this.prisma.timeEntry.findMany({
      where: { userId, date: { gte: firstDay, lte: lastDay }, endedAt: { not: null } },
      include: { project: { select: { id: true, name: true, color: true } } },
    });

    const totalMonthSeconds = entries.reduce((sum, e) => sum + (e.duration ?? 0), 0);
    const byProject = new Map<string, { projectId: string; projectName: string; color: string | null; totalSeconds: number }>();
    const byDay = new Map<string, number>();

    for (const e of entries) {
      const key = e.projectId;
      const ex = byProject.get(key) ?? { projectId: e.project.id, projectName: e.project.name, color: e.project.color, totalSeconds: 0 };
      ex.totalSeconds += e.duration ?? 0;
      byProject.set(key, ex);

      const dayKey = e.date.toISOString().split('T')[0];
      byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + (e.duration ?? 0));
    }

    return {
      month,
      totalSeconds: totalMonthSeconds,
      totalFormatted: formatDuration(totalMonthSeconds),
      byProject: Array.from(byProject.values()).map((p) => ({
        ...p,
        percentage: totalMonthSeconds > 0 ? Math.round((p.totalSeconds / totalMonthSeconds) * 1000) / 10 : 0,
        totalFormatted: formatDuration(p.totalSeconds),
      })),
      byDay: Array.from(byDay.entries()).map(([date, seconds]) => ({
        date, totalSeconds: seconds, totalFormatted: formatDuration(seconds),
      })).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async getAllocationReport(
    granularity: 'day' | 'month' | 'year',
    value: string,
    currentUser: JwtPayload,
  ) {
    if (currentUser.role === 'member') throw new ForbiddenException('Acesso não permitido');

    // ── Date range ──────────────────────────────────────────────────────────
    let firstDay: Date;
    let lastDay: Date;
    if (granularity === 'day') {
      firstDay = new Date(value);
      lastDay = new Date(value);
    } else if (granularity === 'month') {
      const [y, m] = value.split('-').map(Number);
      firstDay = new Date(y, m - 1, 1);
      lastDay = new Date(y, m, 0);
    } else {
      const y = parseInt(value, 10);
      firstDay = new Date(y, 0, 1);
      lastDay = new Date(y, 11, 31);
    }

    // ── Queries ──────────────────────────────────────────────────────────────
    const [allUsers, allTeams, entries] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true, name: true, email: true, avatarUrl: true, teamId: true,
          team: { select: { id: true, name: true } },
        },
      }),
      this.prisma.team.findMany({ select: { id: true, name: true } }),
      this.prisma.timeEntry.findMany({
        where: { date: { gte: firstDay, lte: lastDay }, endedAt: { not: null } },
        select: {
          userId: true, projectId: true, duration: true,
          project: { select: { id: true, name: true, color: true } },
        },
      }),
    ]);

    // ── Member aggregation ────────────────────────────────────────────────
    type ProjAgg = { projectId: string; projectName: string; color: string | null; totalSeconds: number };
    type MemberAgg = { totalSeconds: number; byProject: Map<string, ProjAgg> };
    const memberAgg = new Map<string, MemberAgg>();

    for (const entry of entries) {
      if (!entry.project) continue;
      const dur = entry.duration ?? 0;
      if (!memberAgg.has(entry.userId)) {
        memberAgg.set(entry.userId, { totalSeconds: 0, byProject: new Map() });
      }
      const m = memberAgg.get(entry.userId)!;
      m.totalSeconds += dur;
      const existing = m.byProject.get(entry.projectId);
      if (existing) {
        existing.totalSeconds += dur;
      } else {
        m.byProject.set(entry.projectId, {
          projectId: entry.project.id,
          projectName: entry.project.name,
          color: entry.project.color,
          totalSeconds: dur,
        });
      }
    }

    // ── Team aggregation ──────────────────────────────────────────────────
    type TeamAgg = { teamName: string; totalSeconds: number; byProject: Map<string, ProjAgg> };
    const teamAgg = new Map<string, TeamAgg>();

    // Seed all teams with 0h so they always appear
    for (const t of allTeams) {
      teamAgg.set(t.id, { teamName: t.name, totalSeconds: 0, byProject: new Map() });
    }

    for (const [userId, mData] of memberAgg) {
      const user = allUsers.find((u) => u.id === userId);
      if (!user?.teamId) continue;
      const t = teamAgg.get(user.teamId);
      if (!t) continue;
      t.totalSeconds += mData.totalSeconds;
      for (const [projId, p] of mData.byProject) {
        const tp = t.byProject.get(projId);
        if (tp) { tp.totalSeconds += p.totalSeconds; }
        else { t.byProject.set(projId, { ...p }); }
      }
    }

    // ── Helper ─────────────────────────────────────────────────────────────
    const toProjectList = (byProject: Map<string, ProjAgg>, total: number) =>
      Array.from(byProject.values())
        .map((p) => ({
          ...p,
          percentage: total > 0 ? Math.round((p.totalSeconds / total) * 1000) / 10 : 0,
          totalFormatted: formatDuration(p.totalSeconds),
        }))
        .sort((a, b) => b.totalSeconds - a.totalSeconds);

    // ── Build results ─────────────────────────────────────────────────────
    const teams = Array.from(teamAgg.entries())
      .map(([teamId, t]) => ({
        teamId,
        teamName: t.teamName,
        totalSeconds: t.totalSeconds,
        totalFormatted: formatDuration(t.totalSeconds),
        byProject: toProjectList(t.byProject, t.totalSeconds),
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    const members = allUsers
      .map((user) => {
        const agg = memberAgg.get(user.id);
        const total = agg?.totalSeconds ?? 0;
        return {
          member: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            teamId: user.teamId,
            teamName: user.team?.name ?? null,
          },
          totalSeconds: total,
          totalFormatted: formatDuration(total),
          byProject: agg ? toProjectList(agg.byProject, total) : [],
        };
      })
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    return { granularity, value, teams, members };
  }

  async getTeamReport(teamId: string, month: string, currentUser: JwtPayload) {
    if (currentUser.role === 'member') throw new ForbiddenException('Acesso não permitido');

    const [year, mon] = month.split('-').map(Number);
    const firstDay = new Date(year, mon - 1, 1);
    const lastDay = new Date(year, mon, 0);

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });
    if (!team) throw new ForbiddenException('Equipe não encontrada');

    const result = await Promise.all(
      team.members.map(async (member) => {
        const entries = await this.prisma.timeEntry.findMany({
          where: { userId: member.id, date: { gte: firstDay, lte: lastDay }, endedAt: { not: null } },
          include: { project: { select: { id: true, name: true, color: true } } },
        });

        const totalSeconds = entries.reduce((s, e) => s + (e.duration ?? 0), 0);
        const byProject = new Map<string, { projectId: string; projectName: string; totalSeconds: number }>();
        for (const e of entries) {
          const ex = byProject.get(e.projectId) ?? { projectId: e.project.id, projectName: e.project.name, totalSeconds: 0 };
          ex.totalSeconds += e.duration ?? 0;
          byProject.set(e.projectId, ex);
        }

        return {
          member: { id: member.id, name: member.name, email: member.email, avatarUrl: member.avatarUrl },
          totalSeconds,
          totalFormatted: formatDuration(totalSeconds),
          byProject: Array.from(byProject.values()),
        };
      }),
    );

    return { teamId, month, members: result.sort((a, b) => b.totalSeconds - a.totalSeconds) };
  }
}
