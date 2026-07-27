import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { PrismaService } from '../../database/prisma.service';
import type { CreateTeamDto, UpdateTeamDto } from './dto/team.dto';
@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}
  list(actor: AuthenticatedActor) {
    return this.prisma.team.findMany({
      where: { organizationId: actor.organizationId, deletedAt: null },
      include: {
        memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  }
  async create(actor: AuthenticatedActor, dto: CreateTeamDto) {
    await this.ensureManager(actor, dto.managerId);
    try {
      return await this.prisma.team.create({
        data: {
          organizationId: actor.organizationId,
          name: dto.name.trim(),
          description: dto.description,
          managerId: dto.managerId,
        },
      });
    } catch {
      throw new ConflictException({
        code: 'TEAM_NAME_UNAVAILABLE',
        message: 'Já existe uma equipe com esse nome.',
      });
    }
  }
  async update(actor: AuthenticatedActor, id: string, dto: UpdateTeamDto) {
    await this.ensureManager(actor, dto.managerId);
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: null },
    });
    if (!team)
      throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: 'Equipe não encontrada.' });
    return this.prisma.team.update({
      where: { id },
      data: { name: dto.name?.trim(), description: dto.description, managerId: dto.managerId },
    });
  }
  async archive(actor: AuthenticatedActor, id: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId: actor.organizationId, deletedAt: null },
    });
    if (!team)
      throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: 'Equipe não encontrada.' });
    return this.prisma.team.update({ where: { id }, data: { deletedAt: new Date() } });
  }
  private async ensureManager(actor: AuthenticatedActor, managerId?: string) {
    if (
      managerId &&
      !(await this.prisma.membership.count({
        where: { organizationId: actor.organizationId, userId: managerId },
      }))
    )
      throw new NotFoundException({ code: 'MANAGER_NOT_FOUND', message: 'Gestor não encontrado.' });
  }
}
