import { Injectable, NotFoundException } from '@nestjs/common';
import { AutomationRunStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateAutomationDto, UpdateAutomationDto } from './dto/automation.dto';

@Injectable()
export class AutomationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  list(actor: AuthenticatedActor) {
    return this.prisma.automation.findMany({
      where: { organizationId: actor.organizationId, deletedAt: null },
      include: { _count: { select: { runs: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }
  async create(actor: AuthenticatedActor, dto: CreateAutomationDto) {
    const automation = await this.prisma.automation.create({
      data: {
        organizationId: actor.organizationId,
        name: dto.name.trim(),
        description: dto.description,
        trigger: dto.trigger,
        conditions: (dto.conditions ?? []) as Prisma.InputJsonValue,
        actions: (dto.actions ?? []) as Prisma.InputJsonValue,
        status: dto.status ?? 'DRAFT',
      },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'automation.created',
      entity: 'Automation',
      entityId: automation.id,
    });
    return automation;
  }
  async update(actor: AuthenticatedActor, id: string, dto: UpdateAutomationDto) {
    await this.get(actor, id);
    return this.prisma.automation.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description,
        trigger: dto.trigger,
        conditions: dto.conditions as Prisma.InputJsonValue | undefined,
        actions: dto.actions as Prisma.InputJsonValue | undefined,
        status: dto.status,
      },
    });
  }
  async run(actor: AuthenticatedActor, id: string) {
    const automation = await this.get(actor, id);
    const run = await this.prisma.automationRun.create({
      data: {
        organizationId: actor.organizationId,
        automationId: automation.id,
        idempotencyKey: randomUUID(),
        status: AutomationRunStatus.RUNNING,
        startedAt: new Date(),
        payload: { initiatedBy: actor.userId },
      },
    });
    try {
      const actions = Array.isArray(automation.actions) ? automation.actions : [];
      for (const action of actions) {
        if (typeof action !== 'object' || action === null) continue;
        const definition = action as Record<string, unknown>;
        if (definition.type === 'create_task' && typeof definition.title === 'string')
          await this.prisma.task.create({
            data: {
              organizationId: actor.organizationId,
              title: definition.title,
              createdById: actor.userId,
              assigneeId:
                typeof definition.assigneeId === 'string' ? definition.assigneeId : actor.userId,
            },
          });
        if (definition.type === 'notify' && typeof definition.title === 'string')
          await this.prisma.notification.create({
            data: {
              organizationId: actor.organizationId,
              userId: typeof definition.userId === 'string' ? definition.userId : actor.userId,
              type: 'ASSIGNMENT',
              title: definition.title,
              body: typeof definition.body === 'string' ? definition.body : 'Automação executada.',
            },
          });
      }
      return await this.prisma.automationRun.update({
        where: { id: run.id },
        data: { status: AutomationRunStatus.SUCCEEDED, finishedAt: new Date() },
      });
    } catch (error) {
      await this.prisma.automationRun.update({
        where: { id: run.id },
        data: {
          status: AutomationRunStatus.FAILED,
          finishedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Erro na automação.',
        },
      });
      throw error;
    }
  }
  async runs(actor: AuthenticatedActor, id: string) {
    await this.get(actor, id);
    return this.prisma.automationRun.findMany({
      where: { automationId: id, organizationId: actor.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
  private async get(actor: AuthenticatedActor, id: string) {
    const automation = await this.prisma.automation.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: null },
    });
    if (!automation)
      throw new NotFoundException({
        code: 'AUTOMATION_NOT_FOUND',
        message: 'Automação não encontrada.',
      });
    return automation;
  }
}
