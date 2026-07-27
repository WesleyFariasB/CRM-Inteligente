import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { LeadStatus } from '@prisma/client';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { paginationMeta } from '../../common/pagination/pagination-query.dto';
import { definedValues } from '../../common/utils/defined-values';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CreateLeadDto, LeadQueryDto, UpdateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(actor: AuthenticatedActor, query: LeadQueryDto) {
    const where: Prisma.LeadWhereInput = {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { data, meta: paginationMeta(query.page, query.limit, total) };
  }

  async get(actor: AuthenticatedActor, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: null },
      include: {
        assignee: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        activities: { where: { deletedAt: null }, orderBy: { scheduledAt: 'desc' }, take: 20 },
        tasks: { where: { deletedAt: null }, orderBy: { dueAt: 'asc' }, take: 20 },
        timelineNotes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20 },
        opportunities: {
          where: { deletedAt: null },
          select: { id: true, title: true, value: true, status: true },
        },
      },
    });
    if (!lead)
      throw new NotFoundException({ code: 'LEAD_NOT_FOUND', message: 'Lead não encontrado.' });
    return lead;
  }

  async create(actor: AuthenticatedActor, dto: CreateLeadDto) {
    await this.verifyReferences(actor, dto.assigneeId, dto.companyId);
    if (dto.email) {
      const duplicate = await this.prisma.lead.findFirst({
        where: {
          organizationId: actor.organizationId,
          email: dto.email.trim().toLowerCase(),
          deletedAt: null,
        },
        select: { id: true },
      });
      if (duplicate)
        throw new ConflictException({
          code: 'POSSIBLE_DUPLICATE',
          message: 'Já existe um lead ativo com este e-mail.',
        });
    }
    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name.trim(),
        email: dto.email?.trim().toLowerCase(),
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        jobTitle: dto.jobTitle,
        source: dto.source,
        campaign: dto.campaign,
        status: dto.status,
        temperature: dto.temperature,
        score: dto.score,
        interest: dto.interest,
        tags: dto.tags,
        notes: dto.notes,
        assigneeId: dto.assigneeId,
        companyId: dto.companyId,
        organizationId: actor.organizationId,
        createdById: actor.userId,
        consentAt: dto.email ? new Date() : undefined,
      },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'lead.created',
      entity: 'Lead',
      entityId: lead.id,
      after: { name: lead.name, status: lead.status },
    });
    return lead;
  }

  async update(actor: AuthenticatedActor, id: string, dto: UpdateLeadDto) {
    const current = await this.get(actor, id);
    await this.verifyReferences(actor, dto.assigneeId, dto.companyId);
    const lead = await this.prisma.lead.update({
      where: { id },
      data: definedValues({ ...dto, email: dto.email?.trim().toLowerCase() }),
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'lead.updated',
      entity: 'Lead',
      entityId: id,
      before: { name: current.name, status: current.status, assigneeId: current.assigneeId },
      after: { name: lead.name, status: lead.status, assigneeId: lead.assigneeId },
    });
    return lead;
  }

  async archive(actor: AuthenticatedActor, id: string) {
    await this.get(actor, id);
    const lead = await this.prisma.lead.update({
      where: { id },
      data: { deletedAt: new Date(), status: LeadStatus.ARCHIVED },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'lead.archived',
      entity: 'Lead',
      entityId: id,
    });
    return lead;
  }

  async restore(actor: AuthenticatedActor, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: { not: null } },
    });
    if (!lead)
      throw new NotFoundException({ code: 'LEAD_NOT_FOUND', message: 'Lead não encontrado.' });
    return this.prisma.lead.update({
      where: { id },
      data: { deletedAt: null, status: LeadStatus.NEW },
    });
  }

  async convert(actor: AuthenticatedActor, id: string) {
    await this.get(actor, id);
    const lead = await this.prisma.lead.update({
      where: { id },
      data: { status: LeadStatus.CONVERTED, convertedAt: new Date() },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'lead.converted',
      entity: 'Lead',
      entityId: id,
    });
    return lead;
  }

  private async verifyReferences(
    actor: AuthenticatedActor,
    assigneeId?: string,
    companyId?: string,
  ): Promise<void> {
    if (assigneeId) {
      const exists = await this.prisma.membership.count({
        where: { organizationId: actor.organizationId, userId: assigneeId },
      });
      if (!exists)
        throw new NotFoundException({
          code: 'ASSIGNEE_NOT_FOUND',
          message: 'Responsável não encontrado.',
        });
    }
    if (companyId) {
      const exists = await this.prisma.company.count({
        where: { id: companyId, organizationId: actor.organizationId, deletedAt: null },
      });
      if (!exists)
        throw new NotFoundException({
          code: 'COMPANY_NOT_FOUND',
          message: 'Empresa não encontrada.',
        });
    }
  }
}
