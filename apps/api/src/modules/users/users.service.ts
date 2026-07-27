import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { effectivePermissions } from '../../common/auth/permissions';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { InviteUserDto, UpdateMembershipDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  async list(actor: AuthenticatedActor) {
    const memberships = await this.prisma.membership.findMany({
      where: { organizationId: actor.organizationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            title: true,
            avatarUrl: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((membership) => ({
      ...membership,
      effectivePermissions: effectivePermissions(membership.role, membership.permissions),
    }));
  }
  async invite(actor: AuthenticatedActor, dto: InviteUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          name: dto.name.trim(),
          email,
          passwordHash: await argon2.hash(randomBytes(32).toString('hex'), {
            type: argon2.argon2id,
          }),
        },
      }));
    const duplicate = await this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId: actor.organizationId, userId: user.id } },
    });
    if (duplicate)
      throw new ConflictException({
        code: 'MEMBERSHIP_EXISTS',
        message: 'Esse usuário já pertence à organização.',
      });
    if (
      dto.teamId &&
      !(await this.prisma.team.count({
        where: { id: dto.teamId, organizationId: actor.organizationId, deletedAt: null },
      }))
    )
      throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: 'Equipe não encontrada.' });
    const membership = await this.prisma.membership.create({
      data: {
        organizationId: actor.organizationId,
        userId: user.id,
        role: dto.role ?? 'VIEWER',
        teamId: dto.teamId,
        invitedAt: new Date(),
      },
      include: { user: true },
    });
    const token = randomBytes(32).toString('base64url');
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'user.invited',
      entity: 'Membership',
      entityId: membership.id,
      after: { email, role: membership.role },
    });
    return { id: membership.id, email: membership.user.email, status: 'pending_invitation' };
  }
  async updateMembership(
    actor: AuthenticatedActor,
    membershipId: string,
    dto: UpdateMembershipDto,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId: actor.organizationId },
      include: { user: true },
    });
    if (!membership)
      throw new NotFoundException({
        code: 'MEMBERSHIP_NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
    if (membership.userId === actor.userId && dto.role && dto.role !== membership.role)
      throw new ConflictException({
        code: 'SELF_ROLE_CHANGE_FORBIDDEN',
        message: 'Você não pode alterar seu próprio papel.',
      });
    if (
      dto.teamId &&
      !(await this.prisma.team.count({
        where: { id: dto.teamId, organizationId: actor.organizationId, deletedAt: null },
      }))
    )
      throw new NotFoundException({ code: 'TEAM_NOT_FOUND', message: 'Equipe não encontrada.' });
    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: dto.role, permissions: dto.permissions, teamId: dto.teamId },
      include: { user: true, team: true },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'membership.updated',
      entity: 'Membership',
      entityId: membershipId,
      before: { role: membership.role },
      after: { role: updated.role, permissions: updated.permissions },
    });
    return updated;
  }
  async deactivate(actor: AuthenticatedActor, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId: actor.organizationId },
    });
    if (!membership)
      throw new NotFoundException({
        code: 'MEMBERSHIP_NOT_FOUND',
        message: 'Usuário não encontrado.',
      });
    if (membership.userId === actor.userId)
      throw new ConflictException({
        code: 'SELF_DEACTIVATION_FORBIDDEN',
        message: 'Você não pode desativar seu próprio acesso.',
      });
    await this.prisma.user.update({ where: { id: membership.userId }, data: { isActive: false } });
    await this.prisma.session.updateMany({
      where: { userId: membership.userId, organizationId: actor.organizationId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.record({
      organizationId: actor.organizationId,
      userId: actor.userId,
      action: 'user.deactivated',
      entity: 'Membership',
      entityId: membershipId,
    });
  }
}
