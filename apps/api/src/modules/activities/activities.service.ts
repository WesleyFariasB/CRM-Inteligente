import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { ActivityStatus } from '@prisma/client';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { paginationMeta } from '../../common/pagination/pagination-query.dto';
import { definedValues } from '../../common/utils/defined-values';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { ActivityQueryDto, CreateActivityDto, UpdateActivityDto } from './dto/activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  async list(actor: AuthenticatedActor, query: ActivityQueryDto) {
    const where: Prisma.ActivityWhereInput = {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { scheduledAt: 'asc' },
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { data, meta: paginationMeta(query.page, query.limit, total) };
  }
  async create(actor: AuthenticatedActor, dto: CreateActivityDto) {
    await this.ensureReferences(actor, dto);
    const activity = await this.prisma.activity.create({
      data: {
        ...dto,
        title: dto.title.trim(),
        scheduledAt: new Date(dto.scheduledAt),
        reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : undefined,
        organizationId: actor.organizationId,
        createdById: actor.userId,
      },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'activity.created',
      entity: 'Activity',
      entityId: activity.id,
      after: { type: activity.type, title: activity.title },
    });
    return activity;
  }
  async update(actor: AuthenticatedActor, id: string, dto: UpdateActivityDto) {
    const current = await this.get(actor, id);
    await this.ensureReferences(actor, dto);
    const activity = await this.prisma.activity.update({
      where: { id },
      data: definedValues({
        ...dto,
        title: dto.title?.trim(),
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : undefined,
      }),
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'activity.updated',
      entity: 'Activity',
      entityId: id,
      before: { status: current.status },
      after: { status: activity.status },
    });
    return activity;
  }
  async complete(actor: AuthenticatedActor, id: string) {
    return this.update(actor, id, { status: ActivityStatus.COMPLETED });
  }
  async archive(actor: AuthenticatedActor, id: string) {
    await this.get(actor, id);
    return this.prisma.activity.update({
      where: { id },
      data: { deletedAt: new Date(), status: ActivityStatus.CANCELED },
    });
  }
  private async get(actor: AuthenticatedActor, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: null },
    });
    if (!activity)
      throw new NotFoundException({
        code: 'ACTIVITY_NOT_FOUND',
        message: 'Atividade não encontrada.',
      });
    return activity;
  }
  private async ensureReferences(actor: AuthenticatedActor, dto: Partial<CreateActivityDto>) {
    const checks = await Promise.all([
      dto.leadId
        ? this.prisma.lead.count({
            where: { id: dto.leadId, organizationId: actor.organizationId, deletedAt: null },
          })
        : 1,
      dto.companyId
        ? this.prisma.company.count({
            where: { id: dto.companyId, organizationId: actor.organizationId, deletedAt: null },
          })
        : 1,
      dto.contactId
        ? this.prisma.contact.count({
            where: { id: dto.contactId, organizationId: actor.organizationId, deletedAt: null },
          })
        : 1,
      dto.opportunityId
        ? this.prisma.opportunity.count({
            where: { id: dto.opportunityId, organizationId: actor.organizationId, deletedAt: null },
          })
        : 1,
    ]);
    if (checks.some((count) => count === 0))
      throw new NotFoundException({
        code: 'RELATED_RECORD_NOT_FOUND',
        message: 'Um registro relacionado não foi encontrado.',
      });
  }
}
