import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}
  async list(actor: AuthenticatedActor) {
    return this.prisma.notification.findMany({
      where: { organizationId: actor.organizationId, userId: actor.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
  async markRead(actor: AuthenticatedActor, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, organizationId: actor.organizationId, userId: actor.userId },
    });
    if (!notification)
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Notificação não encontrada.',
      });
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }
  async markAllRead(actor: AuthenticatedActor) {
    return this.prisma.notification.updateMany({
      where: { organizationId: actor.organizationId, userId: actor.userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
