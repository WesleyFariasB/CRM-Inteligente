import { effectivePermissions, rolePermissions } from './permissions';

describe('permissões por papel', () => {
  it('mantém as permissões administrativas no proprietário', () => {
    expect(rolePermissions.OWNER).toContain('audit:read');
    expect(rolePermissions.OWNER).toContain('settings:manage');
  });

  it('aceita apenas exceções de permissão conhecidas', () => {
    expect(effectivePermissions('SELLER', ['reports:read', 'desconhecida:admin'])).toEqual(
      expect.arrayContaining(['leads:read', 'reports:read']),
    );
    expect(effectivePermissions('SELLER', ['desconhecida:admin'])).not.toContain(
      'desconhecida:admin',
    );
  });
});
