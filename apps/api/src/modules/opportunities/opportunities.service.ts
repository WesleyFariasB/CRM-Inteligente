import { Injectable, NotFoundException } from '@nestjs/common';
import { OpportunityStatus, Prisma } from '@prisma/client';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { paginationMeta } from '../../common/pagination/pagination-query.dto';
import { definedValues } from '../../common/utils/defined-values';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type {
  CreateOpportunityDto,
  MoveOpportunityDto,
  OpportunityQueryDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';

@Injectable()
export class OpportunitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  async list(actor: AuthenticatedActor, query: OpportunityQueryDto) {
    const where: Prisma.OpportunityWhereInput = {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(query.pipelineId ? { pipelineId: query.pipelineId } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.opportunity.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          stage: true,
          pipeline: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
        },
      }),
      this.prisma.opportunity.count({ where }),
    ]);
    return { data, meta: paginationMeta(query.page, query.limit, total) };
  }
  async get(actor: AuthenticatedActor, id: string) {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: null },
      include: {
        stage: true,
        pipeline: { include: { stages: { orderBy: { position: 'asc' } } } },
        company: true,
        contact: true,
        lead: true,
        products: { include: { product: true } },
        activities: { where: { deletedAt: null }, orderBy: { scheduledAt: 'desc' } },
        tasks: { where: { deletedAt: null }, orderBy: { dueAt: 'asc' } },
        timelineNotes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        stageHistory: { include: { stage: true }, orderBy: { enteredAt: 'desc' } },
      },
    });
    if (!opportunity)
      throw new NotFoundException({
        code: 'OPPORTUNITY_NOT_FOUND',
        message: 'Oportunidade não encontrada.',
      });
    return opportunity;
  }
  async create(actor: AuthenticatedActor, dto: CreateOpportunityDto) {
    const stage = await this.getStage(actor, dto.pipelineId, dto.stageId);
    const opportunity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.opportunity.create({
        data: {
          organizationId: actor.organizationId,
          title: dto.title.trim(),
          value: new Prisma.Decimal(dto.value),
          pipelineId: dto.pipelineId,
          stageId: dto.stageId,
          probability: dto.probability ?? stage.probability,
          expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
          companyId: dto.companyId,
          contactId: dto.contactId,
          leadId: dto.leadId,
          ownerId: dto.ownerId,
          source: dto.source,
          tags: dto.tags,
          notes: dto.notes,
          createdById: actor.userId,
          status: stage.isWon
            ? OpportunityStatus.WON
            : stage.isLost
              ? OpportunityStatus.LOST
              : OpportunityStatus.OPEN,
        },
      });
      await tx.opportunityStageHistory.create({
        data: {
          organizationId: actor.organizationId,
          opportunityId: created.id,
          stageId: stage.id,
          changedById: actor.userId,
        },
      });
      return created;
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'opportunity.created',
      entity: 'Opportunity',
      entityId: opportunity.id,
      after: { title: opportunity.title, stageId: opportunity.stageId },
    });
    return opportunity;
  }
  async update(actor: AuthenticatedActor, id: string, dto: UpdateOpportunityDto) {
    const current = await this.get(actor, id);
    const opportunity = await this.prisma.opportunity.update({
      where: { id },
      data: definedValues({
        ...dto,
        title: dto.title?.trim(),
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : undefined,
        value: dto.value !== undefined ? new Prisma.Decimal(dto.value) : undefined,
      }),
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'opportunity.updated',
      entity: 'Opportunity',
      entityId: id,
      before: { title: current.title, value: current.value.toString() },
      after: { title: opportunity.title, value: opportunity.value.toString() },
    });
    return opportunity;
  }
  async move(actor: AuthenticatedActor, id: string, dto: MoveOpportunityDto) {
    const current = await this.get(actor, id);
    const stage = await this.getStage(actor, current.pipelineId, dto.stageId);
    const now = new Date();
    const opportunity = await this.prisma.$transaction(async (tx) => {
      await tx.opportunityStageHistory.updateMany({
        where: { opportunityId: id, leftAt: null },
        data: { leftAt: now },
      });
      const updated = await tx.opportunity.update({
        where: { id },
        data: {
          stageId: stage.id,
          probability: stage.probability,
          status: stage.isWon
            ? OpportunityStatus.WON
            : stage.isLost
              ? OpportunityStatus.LOST
              : OpportunityStatus.OPEN,
          wonAt: stage.isWon ? now : null,
          lostAt: stage.isLost ? now : null,
          lostReason: stage.isLost ? current.lostReason : null,
        },
      });
      await tx.opportunityStageHistory.create({
        data: {
          organizationId: actor.organizationId,
          opportunityId: id,
          stageId: stage.id,
          changedById: actor.userId,
          enteredAt: now,
        },
      });
      return updated;
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'opportunity.stage_changed',
      entity: 'Opportunity',
      entityId: id,
      before: { stageId: current.stageId },
      after: { stageId: stage.id },
    });
    return opportunity;
  }
  async archive(actor: AuthenticatedActor, id: string) {
    await this.get(actor, id);
    return this.prisma.opportunity.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  private async getStage(actor: AuthenticatedActor, pipelineId: string, stageId: string) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: {
        id: stageId,
        pipelineId,
        pipeline: { organizationId: actor.organizationId, deletedAt: null },
      },
    });
    if (!stage)
      throw new NotFoundException({
        code: 'PIPELINE_STAGE_NOT_FOUND',
        message: 'Etapa não encontrada no funil informado.',
      });
    return stage;
  }
}
