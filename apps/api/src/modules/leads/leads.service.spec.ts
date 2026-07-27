import { LeadsService } from './leads.service';

interface ScopedQuery {
  where: { organizationId: string; deletedAt?: null };
}

describe('LeadsService', () => {
  it('sempre filtra a listagem pela organização do ator', async () => {
    const findMany = jest.fn<Promise<unknown>, [ScopedQuery]>().mockResolvedValue([]);
    const count = jest.fn<Promise<unknown>, [ScopedQuery]>().mockResolvedValue(0);
    const prisma = {
      lead: {
        findMany,
        count,
      },
      $transaction: jest.fn().mockResolvedValue([[], 0]),
    };
    const audit = { record: jest.fn() };
    const service = new LeadsService(prisma as never, audit as never);

    await service.list(
      {
        userId: 'user-a',
        organizationId: 'org-a',
        sessionId: 'session-a',
        role: 'OWNER',
        permissions: [],
      },
      { page: 1, limit: 20 },
    );

    expect(findMany.mock.calls[0]?.[0].where).toMatchObject({
      organizationId: 'org-a',
      deletedAt: null,
    });
    expect(count.mock.calls[0]?.[0].where).toMatchObject({ organizationId: 'org-a' });
  });
});
