import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { TaskStatus } from '@prisma/client';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { paginationMeta } from '../../common/pagination/pagination-query.dto';
import { definedValues } from '../../common/utils/defined-values';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateTaskDto, TaskQueryDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  async list(actor: AuthenticatedActor, query: TaskQueryDto) {
    const where: Prisma.TaskWhereInput = {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          assignee: { select: { id: true, name: true } },
          lead: { select: { id: true, name: true } },
          opportunity: { select: { id: true, title: true } },
        },
      }),
      this.prisma.task.count({ where }),
    ]);
    return { data, meta: paginationMeta(query.page, query.limit, total) };
  }
  async create(actor: AuthenticatedActor, dto: CreateTaskDto) {
    await this.ensureReferences(actor, dto);
    const task = await this.prisma.task.create({
      data: {
        ...dto,
        title: dto.title.trim(),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        organizationId: actor.organizationId,
        createdById: actor.userId,
      },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'task.created',
      entity: 'Task',
      entityId: task.id,
      after: { title: task.title, priority: task.priority },
    });
    return task;
  }
  async update(actor: AuthenticatedActor, id: string, dto: UpdateTaskDto) {
    const current = await this.get(actor, id);
    await this.ensureReferences(actor, dto);
    const status = dto.status;
    const task = await this.prisma.task.update({
      where: { id },
      data: definedValues({
        ...dto,
        title: dto.title?.trim(),
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        completedAt: status === TaskStatus.DONE ? new Date() : status ? null : undefined,
      }),
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'task.updated',
      entity: 'Task',
      entityId: id,
      before: { status: current.status },
      after: { status: task.status },
    });
    return task;
  }
  async complete(actor: AuthenticatedActor, id: string) {
    return this.update(actor, id, { status: TaskStatus.DONE });
  }
  async reopen(actor: AuthenticatedActor, id: string) {
    return this.update(actor, id, { status: TaskStatus.TODO });
  }
  async archive(actor: AuthenticatedActor, id: string) {
    await this.get(actor, id);
    return this.prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  private async get(actor: AuthenticatedActor, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: null },
    });
    if (!task)
      throw new NotFoundException({ code: 'TASK_NOT_FOUND', message: 'Tarefa não encontrada.' });
    return task;
  }
  private async ensureReferences(actor: AuthenticatedActor, dto: Partial<CreateTaskDto>) {
    const checks = await Promise.all([
      dto.assigneeId
        ? this.prisma.membership.count({
            where: { organizationId: actor.organizationId, userId: dto.assigneeId },
          })
        : 1,
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
