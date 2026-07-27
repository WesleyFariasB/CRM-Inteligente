import { Injectable } from '@nestjs/common';
import { OpportunityStatus, TaskStatus } from '@prisma/client';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(actor: AuthenticatedActor) {
    const organizationId = actor.organizationId;
    const now = new Date();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [
      leadTotal,
      newLeads,
      convertedLeads,
      opportunityGroups,
      taskGroups,
      overdueTasks,
      stages,
      sourceGroups,
      recentActivities,
    ] = await Promise.all([
      this.prisma.lead.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.lead.count({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      }),
      this.prisma.lead.count({ where: { organizationId, deletedAt: null, status: 'CONVERTED' } }),
      this.prisma.opportunity.groupBy({
        where: { organizationId, deletedAt: null },
        by: ['status'],
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.task.groupBy({
        where: { organizationId, deletedAt: null },
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.task.count({
        where: {
          organizationId,
          deletedAt: null,
          status: { not: TaskStatus.DONE },
          dueAt: { lt: now },
        },
      }),
      this.prisma.pipelineStage.findMany({
        where: { pipeline: { organizationId, deletedAt: null } },
        orderBy: { position: 'asc' },
        include: {
          _count: { select: { opportunities: { where: { organizationId, deletedAt: null } } } },
        },
      }),
      this.prisma.lead.groupBy({
        where: { organizationId, deletedAt: null, source: { not: null } },
        by: ['source'],
        _count: { _all: true },
        orderBy: { _count: { source: 'desc' } },
        take: 8,
      }),
      this.prisma.activity.findMany({
        where: { organizationId, deletedAt: null, scheduledAt: { lte: nextWeek } },
        orderBy: { scheduledAt: 'asc' },
        take: 8,
        select: { id: true, type: true, title: true, scheduledAt: true, status: true },
      }),
    ]);
    const valuesByStatus = new Map(
      opportunityGroups.map((group) => [group.status, Number(group._sum.value ?? 0)]),
    );
    const countsByStatus = new Map(
      opportunityGroups.map((group) => [group.status, group._count._all]),
    );
    const completedTasks =
      taskGroups.find((group) => group.status === TaskStatus.DONE)?._count._all ?? 0;
    const pendingTasks = taskGroups
      .filter((group) => group.status !== TaskStatus.DONE && group.status !== TaskStatus.CANCELED)
      .reduce((total, group) => total + group._count._all, 0);
    return {
      metrics: {
        leadsTotal: leadTotal,
        newLeads,
        conversionRate: leadTotal ? Math.round((convertedLeads / leadTotal) * 100) : 0,
        opportunitiesOpen: countsByStatus.get(OpportunityStatus.OPEN) ?? 0,
        opportunitiesWon: countsByStatus.get(OpportunityStatus.WON) ?? 0,
        opportunitiesLost: countsByStatus.get(OpportunityStatus.LOST) ?? 0,
        revenueWon: valuesByStatus.get(OpportunityStatus.WON) ?? 0,
        revenueForecast: valuesByStatus.get(OpportunityStatus.OPEN) ?? 0,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      funnel: stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
        color: stage.color,
        probability: stage.probability,
        count: stage._count.opportunities,
      })),
      leadSources: sourceGroups.map((group) => ({
        name: group.source ?? 'Não informado',
        value: group._count._all,
      })),
      upcomingActivities: recentActivities,
    };
  }
}
