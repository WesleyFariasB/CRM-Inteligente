import type { MembershipRole } from '@prisma/client';

export const permissionNames = [
  'leads:create',
  'leads:read',
  'leads:update',
  'leads:delete',
  'companies:manage',
  'contacts:manage',
  'pipelines:manage',
  'opportunities:manage',
  'tasks:manage',
  'reports:read',
  'users:manage',
  'settings:manage',
  'automations:manage',
  'audit:read',
  'data:export',
] as const;

export type Permission = (typeof permissionNames)[number];

const allPermissions = [...permissionNames] as Permission[];

export const rolePermissions: Record<MembershipRole, Permission[]> = {
  OWNER: allPermissions,
  ADMIN: allPermissions.filter((permission) => permission !== 'audit:read'),
  MANAGER: [
    'leads:create',
    'leads:read',
    'leads:update',
    'companies:manage',
    'contacts:manage',
    'opportunities:manage',
    'tasks:manage',
    'reports:read',
    'data:export',
  ],
  SELLER: [
    'leads:create',
    'leads:read',
    'leads:update',
    'companies:manage',
    'contacts:manage',
    'opportunities:manage',
    'tasks:manage',
  ],
  SUPPORT: ['leads:read', 'leads:update', 'contacts:manage', 'tasks:manage'],
  ANALYST: ['leads:read', 'reports:read', 'data:export'],
  VIEWER: ['leads:read'],
};

export function effectivePermissions(role: MembershipRole, overrides: string[]): Permission[] {
  const validOverrides = overrides.filter((permission): permission is Permission =>
    permissionNames.includes(permission as Permission),
  );

  return [...new Set([...rolePermissions[role], ...validOverrides])];
}
