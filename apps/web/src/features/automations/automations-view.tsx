'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../../lib/api-client';

interface Automation {
  id: string;
  name: string;
  description?: string | null;
  trigger: string;
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT';
  _count: { runs: number };
}
const schema = z.object({
  name: z.string().min(2, 'Informe o nome.'),
  description: z.string().max(500).optional(),
  trigger: z.string().min(2, 'Informe o gatilho.'),
  actionTitle: z.string().max(180).optional(),
});
type FormValues = z.infer<typeof schema>;
export function AutomationsView() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['automations'],
    queryFn: () => apiRequest<Automation[]>('/automations'),
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { trigger: 'lead.created' },
  });
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['automations'] });
  const create = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest('/automations', {
        method: 'POST',
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          trigger: values.trigger,
          status: 'DRAFT',
          actions: values.actionTitle ? [{ type: 'create_task', title: values.actionTitle }] : [],
        }),
      }),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      form.reset({ trigger: 'lead.created' });
      toast.success('Automação criada como rascunho.');
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar a automação.'),
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Automation['status'] }) =>
      apiRequest(`/automations/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: invalidate,
    onError: () => toast.error('Não foi possível atualizar a automação.'),
  });
  const run = useMutation({
    mutationFn: (id: string) => apiRequest(`/automations/${id}/run`, { method: 'POST' }),
    onSuccess: () => toast.success('Execução registrada.'),
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível executar a automação.',
      ),
  });
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Operação escalável</p>
          <h1>Automações</h1>
          <p>Defina gatilhos e ações repetíveis para o time.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Nova automação
        </Button>
      </header>
      <section className="card">
        {query.isLoading ? (
          <div className="page-loading">Carregando automações…</div>
        ) : query.isError ? (
          <div className="error-state">Não foi possível carregar as automações.</div>
        ) : (
          <div className="activity-list">
            {query.data?.length ? (
              query.data.map((item) => (
                <article className="list-row automation-row" key={item.id}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>
                      {item.description || item.trigger} · {item._count.runs} execuções
                    </p>
                  </div>
                  <span className={`status-pill status-${item.status.toLowerCase()}`}>
                    {item.status.toLowerCase()}
                  </span>
                  <input
                    className="toggle"
                    type="checkbox"
                    checked={item.status === 'ACTIVE'}
                    onChange={(event) =>
                      update.mutate({
                        id: item.id,
                        status: event.target.checked ? 'ACTIVE' : 'PAUSED',
                      })
                    }
                    aria-label={`Ativar ${item.name}`}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => run.mutate(item.id)}
                    disabled={run.isPending}
                  >
                    <Play size={14} /> Executar
                  </Button>
                </article>
              ))
            ) : (
              <div className="empty-state">
                Crie a primeira automação para padronizar a operação.
              </div>
            )}
          </div>
        )}
      </section>
      {open && (
        <>
          <button
            className="drawer-backdrop"
            onClick={() => setOpen(false)}
            aria-label="Fechar formulário"
          />
          <aside className="drawer">
            <div className="drawer-header">
              <h2>Nova automação</h2>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <form
              onSubmit={(event) => void form.handleSubmit((values) => create.mutate(values))(event)}
            >
              <div className="form-grid">
                <div className="field">
                  <label>Nome *</label>
                  <Input {...form.register('name')} />
                  {form.formState.errors.name && (
                    <small>{form.formState.errors.name.message}</small>
                  )}
                </div>
                <div className="field">
                  <label>Gatilho *</label>
                  <select className="select" {...form.register('trigger')}>
                    <option value="lead.created">Lead criado</option>
                    <option value="opportunity.stage_changed">Etapa alterada</option>
                    <option value="task.overdue">Tarefa atrasada</option>
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginTop: '.85rem' }}>
                <label>Descrição</label>
                <Input {...form.register('description')} />
              </div>
              <div className="field" style={{ marginTop: '.85rem' }}>
                <label>Criar tarefa com o título</label>
                <Input
                  placeholder="Ex.: Fazer contato em até 1 dia"
                  {...form.register('actionTitle')}
                />
              </div>
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Salvando…' : 'Criar rascunho'}
                </Button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
