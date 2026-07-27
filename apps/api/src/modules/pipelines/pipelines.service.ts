import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreatePipelineDto, UpdatePipelineStageDto } from './dto/pipeline.dto';

@Injectable()
export class PipelinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(actor: AuthenticatedActor) {
    return this.prisma.pipeline.findMany({
      where: { organizationId: actor.organizationId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        stages: {
          orderBy: { position: 'asc' },
          include: { _count: { select: { opportunities: true } } },
        },
      },
    });
  }

  async create(actor: AuthenticatedActor, dto: CreatePipelineDto) {
    if (dto.stages.length < 2)
      throw new ConflictException({
        code: 'PIPELINE_REQUIRES_STAGES',
        message: 'O funil precisa de ao menos duas etapas.',
      });
    const pipeline = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault)
        await tx.pipeline.updateMany({
          where: { organizationId: actor.organizationId },
          data: { isDefault: false },
        });
      return tx.pipeline.create({
        data: {
          organizationId: actor.organizationId,
          name: dto.name.trim(),
          description: dto.description,
          isDefault: dto.isDefault ?? false,
          stages: { create: dto.stages.map((stage, position) => ({ ...stage, position })) },
        },
        include: { stages: { orderBy: { position: 'asc' } } },
      });
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'pipeline.created',
      entity: 'Pipeline',
      entityId: pipeline.id,
      after: { name: pipeline.name },
    });
    return pipeline;
  }

  async updateStage(actor: AuthenticatedActor, stageId: string, dto: UpdatePipelineStageDto) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, pipeline: { organizationId: actor.organizationId, deletedAt: null } },
      include: { pipeline: true },
    });
    if (!stage)
      throw new NotFoundException({
        code: 'PIPELINE_STAGE_NOT_FOUND',
        message: 'Etapa não encontrada.',
      });
    if (dto.position !== undefined && dto.position !== stage.position) {
      const stages = await this.prisma.pipelineStage.findMany({
        where: { pipelineId: stage.pipelineId },
        orderBy: { position: 'asc' },
      });
      const reordered = stages.filter((candidate) => candidate.id !== stageId);
      reordered.splice(Math.min(dto.position, reordered.length), 0, stage);
      await this.prisma.$transaction(
        reordered.map((candidate, position) =>
          this.prisma.pipelineStage.update({ where: { id: candidate.id }, data: { position } }),
        ),
      );
    }
    const updated = await this.prisma.pipelineStage.update({
      where: { id: stageId },
      data: {
        name: dto.name,
        probability: dto.probability,
        maxDays: dto.maxDays,
        isWon: dto.isWon,
        isLost: dto.isLost,
        color: dto.color,
      },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'pipeline.stage_updated',
      entity: 'PipelineStage',
      entityId: stageId,
      before: { name: stage.name },
      after: { name: updated.name },
    });
    return updated;
  }
}
