import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { UpdateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async get(actor: AuthenticatedActor) {
    const organization = await this.prisma.organization.findFirst({
      where: { id: actor.organizationId, deletedAt: null },
      select: { id: true, name: true, slug: true, timezone: true, settings: true, createdAt: true },
    });
    if (!organization)
      throw new NotFoundException({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organização não encontrada.',
      });
    return organization;
  }

  async update(actor: AuthenticatedActor, dto: UpdateOrganizationDto) {
    const current = await this.get(actor);
    const organization = await this.prisma.organization.update({
      where: { id: actor.organizationId },
      data: {
        name: dto.name?.trim(),
        timezone: dto.timezone,
        settings: dto.settings as Prisma.InputJsonValue | undefined,
      },
      select: { id: true, name: true, slug: true, timezone: true, settings: true },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'organization.updated',
      entity: 'Organization',
      entityId: organization.id,
      before: { name: current.name, timezone: current.timezone },
      after: { name: organization.name, timezone: organization.timezone },
    });
    return organization;
  }
}
