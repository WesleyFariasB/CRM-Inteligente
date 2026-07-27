import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { paginationMeta } from '../../common/pagination/pagination-query.dto';
import { definedValues } from '../../common/utils/defined-values';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { CompanyQueryDto, CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(actor: AuthenticatedActor, query: CompanyQueryDto) {
    const where: Prisma.CompanyWhereInput = {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { document: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { contacts: true, opportunities: true } },
          owner: { select: { id: true, name: true } },
        },
      }),
      this.prisma.company.count({ where }),
    ]);
    return { data, meta: paginationMeta(query.page, query.limit, total) };
  }

  async get(actor: AuthenticatedActor, id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: null },
      include: {
        contacts: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
        opportunities: {
          where: { deletedAt: null },
          select: { id: true, title: true, value: true, status: true },
        },
        activities: { where: { deletedAt: null }, orderBy: { scheduledAt: 'desc' }, take: 20 },
        tasks: { where: { deletedAt: null }, orderBy: { dueAt: 'asc' }, take: 20 },
        timelineNotes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!company)
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: 'Empresa não encontrada.',
      });
    return company;
  }

  async create(actor: AuthenticatedActor, dto: CreateCompanyDto) {
    await this.ensureOwner(actor, dto.ownerId);
    const company = await this.prisma.company.create({
      data: {
        ...dto,
        name: dto.name.trim(),
        email: dto.email?.trim().toLowerCase(),
        organizationId: actor.organizationId,
        createdById: actor.userId,
      },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'company.created',
      entity: 'Company',
      entityId: company.id,
      after: { name: company.name },
    });
    return company;
  }

  async update(actor: AuthenticatedActor, id: string, dto: UpdateCompanyDto) {
    const current = await this.get(actor, id);
    await this.ensureOwner(actor, dto.ownerId);
    const company = await this.prisma.company.update({
      where: { id },
      data: definedValues({
        ...dto,
        name: dto.name?.trim(),
        email: dto.email?.trim().toLowerCase(),
      }),
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'company.updated',
      entity: 'Company',
      entityId: id,
      before: { name: current.name },
      after: { name: company.name },
    });
    return company;
  }

  async archive(actor: AuthenticatedActor, id: string) {
    await this.get(actor, id);
    const company = await this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'company.archived',
      entity: 'Company',
      entityId: id,
    });
    return company;
  }

  private async ensureOwner(actor: AuthenticatedActor, ownerId?: string) {
    if (!ownerId) return;
    const exists = await this.prisma.membership.count({
      where: { organizationId: actor.organizationId, userId: ownerId },
    });
    if (!exists)
      throw new NotFoundException({
        code: 'OWNER_NOT_FOUND',
        message: 'Responsável não encontrado.',
      });
  }
}
