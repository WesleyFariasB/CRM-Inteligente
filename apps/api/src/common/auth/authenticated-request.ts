import type { MembershipRole } from '@prisma/client';
import type { Request } from 'express';
import type { Permission } from './permissions';

export interface AuthenticatedActor {
  userId: string;
  organizationId: string;
  role: MembershipRole;
  permissions: Permission[];
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  actor?: AuthenticatedActor;
}
