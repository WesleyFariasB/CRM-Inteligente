import { Injectable } from '@nestjs/common';
import type { AuthenticatedActor } from '../../common/auth/authenticated-request';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}
  async search(actor: AuthenticatedActor, term: string) {
    const query = term.trim();
    if (query.length < 2) return [];
    const organizationId = actor.organizationId;
    const [leads, companies, contacts, opportunities, tasks] = await Promise.all([
      this.prisma.lead.findMany({
        where: {
          organizationId,
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true },
      }),
      this.prisma.company.findMany({
        where: { organizationId, deletedAt: null, name: { contains: query, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true },
      }),
      this.prisma.contact.findMany({
        where: {
          organizationId,
          deletedAt: null,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true },
      }),
      this.prisma.opportunity.findMany({
        where: { organizationId, deletedAt: null, title: { contains: query, mode: 'insensitive' } },
        take: 5,
        select: { id: true, title: true },
      }),
      this.prisma.task.findMany({
        where: { organizationId, deletedAt: null, title: { contains: query, mode: 'insensitive' } },
        take: 5,
        select: { id: true, title: true },
      }),
    ]);
    return [
      ...leads.map((item) => ({
        type: 'lead',
        id: item.id,
        title: item.name,
        subtitle: item.email,
        href: `/app/leads/${item.id}`,
      })),
      ...companies.map((item) => ({
        type: 'company',
        id: item.id,
        title: item.name,
        href: `/app/companies/${item.id}`,
      })),
      ...contacts.map((item) => ({
        type: 'contact',
        id: item.id,
        title: item.name,
        subtitle: item.email,
        href: `/app/contacts/${item.id}`,
      })),
      ...opportunities.map((item) => ({
        type: 'opportunity',
        id: item.id,
        title: item.title,
        href: `/app/opportunities/${item.id}`,
      })),
      ...tasks.map((item) => ({
        type: 'task',
        id: item.id,
        title: item.title,
        href: `/app/tasks`,
      })),
    ];
  }
}
