import { Injectable } from '@nestjs/common';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}
  async sales(actor: AuthenticatedActor) {
    const [byStage, byOwner, lostReasons] = await Promise.all([
      this.prisma.opportunity.groupBy({
        where: { organizationId: actor.organizationId, deletedAt: null },
        by: ['stageId'],
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.opportunity.groupBy({
        where: { organizationId: actor.organizationId, deletedAt: null },
        by: ['ownerId'],
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.opportunity.groupBy({
        where: { organizationId: actor.organizationId, deletedAt: null, lostReason: { not: null } },
        by: ['lostReason'],
        _count: { _all: true },
      }),
    ]);
    const stageIds = byStage.map((item) => item.stageId);
    const ownerIds = byOwner.map((item) => item.ownerId).filter((id): id is string => Boolean(id));
    const [stages, owners] = await Promise.all([
      this.prisma.pipelineStage.findMany({
        where: { id: { in: stageIds } },
        select: { id: true, name: true, color: true },
      }),
      this.prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, name: true },
      }),
    ]);
    const stageById = new Map(stages.map((stage) => [stage.id, stage]));
    const ownerById = new Map(owners.map((owner) => [owner.id, owner]));
    return {
      pipeline: byStage.map((item) => ({
        stage: stageById.get(item.stageId)?.name ?? 'Etapa removida',
        color: stageById.get(item.stageId)?.color ?? '#64748b',
        count: item._count._all,
        value: Number(item._sum.value ?? 0),
      })),
      sellers: byOwner.map((item) => ({
        seller: item.ownerId
          ? (ownerById.get(item.ownerId)?.name ?? 'Sem responsável')
          : 'Sem responsável',
        count: item._count._all,
        value: Number(item._sum.value ?? 0),
      })),
      lostReasons: lostReasons.map((item) => ({
        reason: item.lostReason ?? 'Não informado',
        count: item._count._all,
      })),
    };
  }
}
