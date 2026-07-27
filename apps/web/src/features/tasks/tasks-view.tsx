'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../../lib/api-client';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  dueAt?: string | null;
  assignee?: { name: string } | null;
  lead?: { name: string } | null;
  opportunity?: { title: string } | null;
}
interface Paged<T> {
  data: T[];
  meta: { total: number };
}
const schema = z.object({
  title: z.string().min(2, 'Informe o título.'),
  description: z.string().max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  dueAt: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
const priorityText: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};
export function TasksView() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiRequest<Paged<Task>>('/tasks?limit=100'),
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  });
  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  const create = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify({ ...values, dueAt: values.dueAt || undefined }),
      }),
    onSuccess: () => {
      invalidate();
      form.reset({ priority: 'MEDIUM' });
      setOpen(false);
      toast.success('Tarefa criada.');
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Não foi possível criar a tarefa.'),
  });
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: invalidate,
    onError: () => toast.error('Não foi possível atualizar a tarefa.'),
  });
  const tasks = query.data?.data ?? [];
  const openTasks = tasks.filter((item) => item.status !== 'DONE' && item.status !== 'CANCELLED');
  const doneTasks = tasks.filter((item) => item.status === 'DONE');
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Execução</p>
          <h1>Tarefas</h1>
          <p>Planeje os próximos passos e não deixe oportunidades esfriar.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Nova tarefa
        </Button>
      </header>
      <section className="card">
        {query.isLoading ? (
          <div className="page-loading">Carregando tarefas…</div>
        ) : query.isError ? (
          <div className="error-state">Não foi possível carregar as tarefas.</div>
        ) : (
          <div className="task-list">
            {openTasks.length === 0 && <p className="empty-inline">Nenhuma tarefa em aberto.</p>}
            {openTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => update.mutate({ id: task.id, status: 'DONE' })}
              />
            ))}
          </div>
        )}
      </section>
      {doneTasks.length > 0 && (
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Concluídas</h2>
              <p>{doneTasks.length} tarefa(s) finalizada(s)</p>
            </div>
          </div>
          <div className="task-list">
            {doneTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => update.mutate({ id: task.id, status: 'TODO' })}
              />
            ))}
          </div>
        </section>
      )}
      {open && (
        <>
          <button
            className="drawer-backdrop"
            aria-label="Fechar formulário"
            onClick={() => setOpen(false)}
          />
          <aside className="drawer">
            <div className="drawer-header">
              <h2>Nova tarefa</h2>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                <X size={18} />
              </Button>
            </div>
            <form
              onSubmit={(event) => void form.handleSubmit((values) => create.mutate(values))(event)}
            >
              <div className="form-grid">
                <div className="field">
                  <label>Título *</label>
                  <Input {...form.register('title')} />
                  {form.formState.errors.title && (
                    <small>{form.formState.errors.title.message}</small>
                  )}
                </div>
                <div className="field">
                  <label>Prazo</label>
                  <Input type="datetime-local" {...form.register('dueAt')} />
                </div>
                <div className="field">
                  <label>Prioridade</label>
                  <select className="select" {...form.register('priority')}>
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginTop: '.85rem' }}>
                <label>Descrição</label>
                <textarea className="textarea" {...form.register('description')} />
              </div>
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Salvando…' : 'Salvar tarefa'}
                </Button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
function TaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const done = task.status === 'DONE';
  return (
    <article className="task-row">
      <input
        className="check"
        type="checkbox"
        checked={done}
        onChange={onToggle}
        aria-label={`Concluir ${task.title}`}
      />
      <div>
        <h3>{task.title}</h3>
        <p>
          {task.opportunity?.title || task.lead?.name || task.assignee?.name || 'Sem vínculo'}
          {task.dueAt ? ` · ${new Date(task.dueAt).toLocaleString('pt-BR')}` : ''}
        </p>
      </div>
      <strong className={`priority-${task.priority.toLowerCase()}`}>
        {priorityText[task.priority] || task.priority}
      </strong>
    </article>
  );
}
