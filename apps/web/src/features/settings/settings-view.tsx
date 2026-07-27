'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../../lib/api-client';
import { useSessionStore } from '../../stores/session-store';

interface Organization {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  settings: Record<string, unknown>;
}
interface Member {
  id: string;
  role: string;
  user: { name: string; email: string; isActive: boolean };
  team?: { name: string } | null;
}
interface Team {
  id: string;
  name: string;
  description?: string | null;
  memberships: unknown[];
}
interface Audit {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
  user?: { name: string } | null;
}
interface Paged<T> {
  data: T[];
}
const orgSchema = z.object({
  name: z.string().min(2, 'Informe o nome.'),
  timezone: z.string().min(3, 'Informe o fuso horário.'),
});
const inviteSchema = z.object({
  name: z.string().min(2, 'Informe o nome.'),
  email: z.email('Informe um e-mail válido.'),
  role: z.enum(['ADMIN', 'MANAGER', 'SELLER', 'SUPPORT', 'ANALYST', 'VIEWER']),
});
type OrgForm = z.infer<typeof orgSchema>;
type InviteForm = z.infer<typeof inviteSchema>;
export function SettingsView() {
  const session = useSessionStore((state) => state.session);
  const canManage = session?.user.permissions.includes('settings:manage') ?? false;
  const canUsers = session?.user.permissions.includes('users:manage') ?? false;
  const canAudit = session?.user.permissions.includes('audit:read') ?? false;
  const [showInvite, setShowInvite] = useState(false);
  const queryClient = useQueryClient();
  const organization = useQuery({
    queryKey: ['organization-settings'],
    enabled: canManage,
    queryFn: () => apiRequest<Organization>('/settings/organization'),
  });
  const users = useQuery({
    queryKey: ['users'],
    enabled: canUsers,
    queryFn: () => apiRequest<Member[]>('/users'),
  });
  const teams = useQuery({
    queryKey: ['teams'],
    enabled: canUsers,
    queryFn: () => apiRequest<Team[]>('/teams'),
  });
  const audits = useQuery({
    queryKey: ['audits'],
    enabled: canAudit,
    queryFn: () => apiRequest<Paged<Audit>>('/audit-logs?limit=8'),
  });
  const orgForm = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: '', timezone: 'America/Sao_Paulo' },
  });
  const inviteForm = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'SELLER' },
  });
  useEffect(() => {
    if (organization.data)
      orgForm.reset({ name: organization.data.name, timezone: organization.data.timezone });
  }, [organization.data, orgForm]);
  const save = useMutation({
    mutationFn: (values: OrgForm) =>
      apiRequest('/settings/organization', { method: 'PATCH', body: JSON.stringify(values) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization-settings'] });
      toast.success('Configurações salvas.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível salvar as configurações.',
      ),
  });
  const invite = useMutation({
    mutationFn: (values: InviteForm) =>
      apiRequest('/users/invite', { method: 'POST', body: JSON.stringify(values) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowInvite(false);
      inviteForm.reset({ role: 'SELLER' });
      toast.success(
        'Convite criado. A entrega de e-mail deve ser configurada no provedor transacional.',
      );
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Não foi possível convidar o usuário.'),
  });
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Configurações</h1>
          <p>Organização, pessoas, equipes e trilha de auditoria.</p>
        </div>
      </header>
      <div className="settings-grid">
        {canManage && (
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Organização</h2>
                <p>{organization.data?.slug ? `/${organization.data.slug}` : 'Carregando…'}</p>
              </div>
            </div>
            <form
              onSubmit={(event) =>
                void orgForm.handleSubmit((values) => save.mutate(values))(event)
              }
              className="auth-form"
            >
              <div className="field">
                <label>Nome</label>
                <Input {...orgForm.register('name')} />
                {orgForm.formState.errors.name && (
                  <small>{orgForm.formState.errors.name.message}</small>
                )}
              </div>
              <div className="field">
                <label>Fuso horário</label>
                <Input {...orgForm.register('timezone')} />
                {orgForm.formState.errors.timezone && (
                  <small>{orgForm.formState.errors.timezone.message}</small>
                )}
              </div>
              <Button type="submit" disabled={save.isPending}>
                <Save size={15} />
                {save.isPending ? 'Salvando…' : 'Salvar alterações'}
              </Button>
            </form>
          </section>
        )}
        {canUsers && (
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Equipes</h2>
                <p>{teams.data?.length ?? 0} equipe(s) ativas</p>
              </div>
            </div>
            <div className="activity-list">
              {teams.data?.length ? (
                teams.data.map((team) => (
                  <div className="list-row" key={team.id}>
                    <div>
                      <h3>{team.name}</h3>
                      <p>
                        {team.description || 'Sem descrição'} · {team.memberships.length} membro(s)
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-inline">Crie equipes pela API para distribuir a operação.</p>
              )}
            </div>
          </section>
        )}
      </div>
      {canUsers && (
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Pessoas e permissões</h2>
              <p>Os papéis controlam o acesso a cada módulo.</p>
            </div>
            <Button size="sm" onClick={() => setShowInvite((value) => !value)}>
              <Plus size={15} /> Convidar
            </Button>
          </div>
          {showInvite && (
            <form
              onSubmit={(event) =>
                void inviteForm.handleSubmit((values) => invite.mutate(values))(event)
              }
              className="form-grid"
              style={{ marginTop: '1rem' }}
            >
              <div className="field">
                <label>Nome</label>
                <Input {...inviteForm.register('name')} />
              </div>
              <div className="field">
                <label>E-mail</label>
                <Input type="email" {...inviteForm.register('email')} />
              </div>
              <div className="field">
                <label>Papel</label>
                <select className="select" {...inviteForm.register('role')}>
                  <option value="SELLER">Vendedor</option>
                  <option value="MANAGER">Gestor</option>
                  <option value="SUPPORT">Suporte</option>
                  <option value="ANALYST">Analista</option>
                  <option value="ADMIN">Administrador</option>
                  <option value="VIEWER">Visualizador</option>
                </select>
              </div>
              <div className="field" style={{ alignSelf: 'end' }}>
                <Button type="submit" disabled={invite.isPending}>
                  {invite.isPending ? 'Enviando…' : 'Criar convite'}
                </Button>
              </div>
            </form>
          )}
          <div className="activity-list">
            {users.data?.map((member) => (
              <div className="list-row" key={member.id}>
                <div>
                  <h3>
                    {member.user.name} <span className="tag">{member.role.toLowerCase()}</span>
                  </h3>
                  <p>
                    {member.user.email} · {member.team?.name || 'Sem equipe'}
                  </p>
                </div>
                <span
                  className={
                    member.user.isActive
                      ? 'status-pill status-converted'
                      : 'status-pill status-archived'
                  }
                >
                  {member.user.isActive ? 'ativo' : 'inativo'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      {canAudit && (
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Auditoria</h2>
              <p>Últimas ações relevantes da organização.</p>
            </div>
          </div>
          <div className="activity-list">
            {audits.data?.data.map((item) => (
              <div className="list-row" key={item.id}>
                <div>
                  <h3>{item.action}</h3>
                  <p>
                    {item.user?.name || 'Sistema'} · {item.entity} ·{' '}
                    {new Date(item.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
            {!audits.data?.data.length && (
              <p className="empty-inline">Nenhuma ação auditada ainda.</p>
            )}
          </div>
        </section>
      )}
      {!canManage && !canUsers && !canAudit && (
        <div className="empty-state">Seu perfil não possui permissões administrativas.</div>
      )}
    </div>
  );
}
