import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MembershipRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import type { Response } from 'express';
import type { Environment } from '../../config/environment';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { effectivePermissions, type Permission } from '../../common/auth/permissions';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: MembershipRole;
    permissions: Permission[];
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService<Environment, true>,
    private readonly audit: AuditService,
  ) {}

  async register(
    dto: RegisterDto,
    context: RequestContext,
  ): Promise<{ response: AuthResponse; refreshToken: string }> {
    const email = dto.email.trim().toLowerCase();
    const slug = this.slugify(dto.organizationSlug ?? dto.organizationName);
    const [existingUser, existingOrganization] = await Promise.all([
      this.prisma.user.findUnique({ where: { email }, select: { id: true } }),
      this.prisma.organization.findUnique({ where: { slug }, select: { id: true } }),
    ]);

    if (existingUser) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_IN_USE',
        message: 'Não foi possível criar a conta.',
      });
    }
    if (existingOrganization) {
      throw new ConflictException({
        code: 'ORGANIZATION_SLUG_UNAVAILABLE',
        message: 'Esse identificador já está em uso.',
      });
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    const created = await this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.organizationName.trim(), slug },
      });
      const user = await tx.user.create({ data: { name: dto.name.trim(), email, passwordHash } });
      const membership = await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: MembershipRole.OWNER,
          acceptedAt: new Date(),
        },
      });
      const pipeline = await tx.pipeline.create({
        data: {
          organizationId: organization.id,
          name: 'Vendas',
          isDefault: true,
          stages: {
            create: [
              { name: 'Novo lead', position: 0, probability: 10, color: '#64748b' },
              { name: 'Qualificação', position: 1, probability: 25, color: '#0ea5e9' },
              { name: 'Contato realizado', position: 2, probability: 40, color: '#8b5cf6' },
              { name: 'Reunião agendada', position: 3, probability: 55, color: '#f59e0b' },
              { name: 'Proposta enviada', position: 4, probability: 70, color: '#f97316' },
              { name: 'Negociação', position: 5, probability: 85, color: '#ec4899' },
              { name: 'Ganho', position: 6, probability: 100, isWon: true, color: '#22c55e' },
              { name: 'Perdido', position: 7, probability: 0, isLost: true, color: '#ef4444' },
            ],
          },
        },
        select: { id: true },
      });
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: 'organization.created',
          entity: 'Organization',
          entityId: organization.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          after: { pipelineId: pipeline.id, role: MembershipRole.OWNER },
        },
      });
      return { organization, user, membership };
    });

    return this.createAuthenticatedSession({
      user: created.user,
      organization: created.organization,
      role: created.membership.role,
      overrides: created.membership.permissions,
      context,
    });
  }

  async login(
    dto: LoginDto,
    context: RequestContext,
  ): Promise<{ response: AuthResponse; refreshToken: string }> {
    const email = dto.email.trim().toLowerCase();
    const membership = await this.prisma.membership.findFirst({
      where: {
        organization: { slug: dto.organizationSlug.trim().toLowerCase(), deletedAt: null },
        user: { email, deletedAt: null },
      },
      include: { user: true, organization: true },
    });

    if (
      !membership ||
      !membership.user.isActive ||
      (membership.user.lockedUntil && membership.user.lockedUntil > new Date())
    ) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciais inválidas.',
      });
    }
    if (!(await argon2.verify(membership.user.passwordHash, dto.password))) {
      await this.registerFailedAttempt(membership.user.id, membership.organizationId, context);
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciais inválidas.',
      });
    }

    await this.prisma.user.update({
      where: { id: membership.user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.audit.record({
      organizationId: membership.organizationId,
      userId: membership.userId,
      action: 'auth.login',
      entity: 'Session',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return this.createAuthenticatedSession({
      user: membership.user,
      organization: membership.organization,
      role: membership.role,
      overrides: membership.permissions,
      context,
    });
  }

  async refresh(
    refreshToken: string | undefined,
    context: RequestContext,
  ): Promise<{ response: AuthResponse; refreshToken: string }> {
    if (!refreshToken)
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Sessão expirada.' });
    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash: this.hashToken(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true, organization: true },
    });
    if (!session || !session.user.isActive)
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Sessão expirada.' });
    const membership = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: { organizationId: session.organizationId, userId: session.userId },
      },
    });
    if (!membership)
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Sessão expirada.' });
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.createAuthenticatedSession({
      user: session.user,
      organization: session.organization,
      role: membership.role,
      overrides: membership.permissions,
      context,
    });
  }

  async logout(refreshToken: string | undefined, actor?: AuthenticatedActor): Promise<void> {
    if (refreshToken) {
      await this.prisma.session.updateMany({
        where: { tokenHash: this.hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    if (actor) {
      await this.audit.record({
        organizationId: actor.organizationId,
        userId: actor.userId,
        action: 'auth.logout',
        entity: 'Session',
        entityId: actor.sessionId,
      });
    }
  }

  async getCurrentUser(
    actor: AuthenticatedActor,
  ): Promise<AuthResponse['user'] & { organization: AuthResponse['organization'] }> {
    const membership = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: { organizationId: actor.organizationId, userId: actor.userId },
      },
      include: { user: true, organization: true },
    });
    if (!membership || !membership.user.isActive || membership.organization.deletedAt) {
      throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Sessão expirada.' });
    }
    return {
      id: membership.user.id,
      name: membership.user.name,
      email: membership.user.email,
      role: membership.role,
      permissions: effectivePermissions(membership.role, membership.permissions),
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
      },
    };
  }

  async requestPasswordReset(dto: { email: string }): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user || !user.isActive) return;
    const token = randomBytes(32).toString('base64url');
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const token = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash: this.hashToken(dto.token), usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!token)
      throw new UnauthorizedException({
        code: 'INVALID_RESET_TOKEN',
        message: 'Link inválido ou expirado.',
      });
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: token.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: token.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.session.updateMany({
        where: { userId: token.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  writeRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie('crm_refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: this.durationToMilliseconds(this.config.get('JWT_REFRESH_TTL', { infer: true })),
    });
  }

  clearRefreshCookie(response: Response): void {
    response.clearCookie('crm_refresh_token', {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  private async createAuthenticatedSession(input: {
    user: { id: string; name: string; email: string };
    organization: { id: string; name: string; slug: string };
    role: MembershipRole;
    overrides: string[];
    context: RequestContext;
  }): Promise<{ response: AuthResponse; refreshToken: string }> {
    const refreshToken = randomBytes(48).toString('base64url');
    const session = await this.prisma.session.create({
      data: {
        userId: input.user.id,
        organizationId: input.organization.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(
          Date.now() +
            this.durationToMilliseconds(this.config.get('JWT_REFRESH_TTL', { infer: true })),
        ),
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent,
      },
    });
    const permissions = effectivePermissions(input.role, input.overrides);
    const accessToken = await this.jwtService.signAsync(
      {
        sub: input.user.id,
        organizationId: input.organization.id,
        role: input.role,
        permissions,
        sessionId: session.id,
      },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        issuer: this.config.get('JWT_ISSUER', { infer: true }),
        audience: this.config.get('JWT_AUDIENCE', { infer: true }),
        expiresIn: this.durationToSeconds(this.config.get('JWT_ACCESS_TTL', { infer: true })),
      },
    );
    return {
      refreshToken,
      response: {
        accessToken,
        user: {
          id: input.user.id,
          name: input.user.name,
          email: input.user.email,
          role: input.role,
          permissions,
        },
        organization: input.organization,
      },
    };
  }

  private async registerFailedAttempt(
    userId: string,
    organizationId: string,
    context: RequestContext,
  ): Promise<void> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    if (user.failedLoginAttempts >= 5) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) },
      });
    }
    await this.audit.record({
      organizationId,
      userId,
      action: 'auth.login_failed',
      entity: 'User',
      entityId: userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }

  private durationToMilliseconds(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const amount = Number(match[1]);
    const multiplier = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[
      match[2] as 's' | 'm' | 'h' | 'd'
    ];
    return amount * multiplier;
  }

  private durationToSeconds(value: string): number {
    return Math.floor(this.durationToMilliseconds(value) / 1000);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private slugify(value: string): string {
    const slug = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return slug || `org-${randomBytes(4).toString('hex')}`;
  }
}
