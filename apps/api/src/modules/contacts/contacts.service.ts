import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { paginationMeta } from '../../common/pagination/pagination-query.dto';
import { definedValues } from '../../common/utils/defined-values';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { ContactQueryDto, CreateContactDto, UpdateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  async list(actor: AuthenticatedActor, query: ContactQueryDto) {
    const where: Prisma.ContactWhereInput = {
      organizationId: actor.organizationId,
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { name: 'asc' },
        include: {
          company: { select: { id: true, name: true } },
          owner: { select: { id: true, name: true } },
        },
      }),
      this.prisma.contact.count({ where }),
    ]);
    return { data, meta: paginationMeta(query.page, query.limit, total) };
  }
  async get(actor: AuthenticatedActor, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: null },
      include: {
        company: true,
        activities: { where: { deletedAt: null }, orderBy: { scheduledAt: 'desc' } },
        tasks: { where: { deletedAt: null }, orderBy: { dueAt: 'asc' } },
        timelineNotes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!contact)
      throw new NotFoundException({
        code: 'CONTACT_NOT_FOUND',
        message: 'Contato não encontrado.',
      });
    return contact;
  }
  async create(actor: AuthenticatedActor, dto: CreateContactDto) {
    await this.ensureReferences(actor, dto.companyId, dto.ownerId);
    const contact = await this.prisma.contact.create({
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
      action: 'contact.created',
      entity: 'Contact',
      entityId: contact.id,
      after: { name: contact.name },
    });
    return contact;
  }
  async update(actor: AuthenticatedActor, id: string, dto: UpdateContactDto) {
    const current = await this.get(actor, id);
    await this.ensureReferences(actor, dto.companyId, dto.ownerId);
    const contact = await this.prisma.contact.update({
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
      action: 'contact.updated',
      entity: 'Contact',
      entityId: id,
      before: { name: current.name },
      after: { name: contact.name },
    });
    return contact;
  }
  async archive(actor: AuthenticatedActor, id: string) {
    await this.get(actor, id);
    return this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  private async ensureReferences(actor: AuthenticatedActor, companyId?: string, ownerId?: string) {
    if (
      companyId &&
      !(await this.prisma.company.count({
        where: { id: companyId, organizationId: actor.organizationId, deletedAt: null },
      }))
    )
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: 'Empresa não encontrada.',
      });
    if (
      ownerId &&
      !(await this.prisma.membership.count({
        where: { organizationId: actor.organizationId, userId: ownerId },
      }))
    )
      throw new NotFoundException({
        code: 'OWNER_NOT_FOUND',
        message: 'Responsável não encontrado.',
      });
  }
}
