'use client';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../../lib/api-client';

interface Stage {
  id: string;
  name: string;
  color: string;
  probability: number;
  _count: { opportunities: number };
}
interface Pipeline {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Stage[];
}
interface Opportunity {
  id: string;
  title: string;
  value: string | number;
  probability: number;
  stageId: string;
  company?: { name: string } | null;
  owner?: { name: string } | null;
}
interface Paged<T> {
  data: T[];
}
const schema = z.object({
  title: z.string().min(2, 'Informe o título.'),
  value: z.number().min(0, 'Informe um valor válido.'),
  stageId: z.string().min(1, 'Selecione uma etapa.'),
});
type FormValues = z.infer<typeof schema>;
const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: opportunity.id,
    data: { opportunity },
  });
  return (
    <article
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="opportunity-card"
      {...attributes}
      {...listeners}
    >
      <h3>{opportunity.title}</h3>
      <p>{money.format(Number(opportunity.value))}</p>
      <small>{opportunity.company?.name || opportunity.owner?.name || 'Sem vínculo'}</small>
    </article>
  );
}

function BoardColumn({ stage, children }: { stage: Stage; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  return (
    <section
      ref={setNodeRef}
      className="board-column"
      style={isOver ? { outline: `2px solid ${stage.color}` } : undefined}
    >
      <div className="board-column-head">
        <h2>{stage.name}</h2>
        <span className="board-count">{stage._count.opportunities}</span>
      </div>
      <div className="board-cards">{children}</div>
    </section>
  );
}

export function OpportunitiesBoard() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Opportunity | null>(null);
  const queryClient = useQueryClient();
  const pipelines = useQuery({
    queryKey: ['pipelines'],
    queryFn: () => apiRequest<Pipeline[]>('/pipelines'),
  });
  const pipeline = pipelines.data?.find((item) => item.isDefault) ?? pipelines.data?.[0];
  const opportunities = useQuery({
    queryKey: ['opportunities', pipeline?.id],
    enabled: Boolean(pipeline),
    queryFn: () =>
      apiRequest<Paged<Opportunity>>(`/opportunities?pipelineId=${pipeline?.id}&limit=100`),
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', value: 0, stageId: '' },
  });
  useEffect(() => {
    if (pipeline?.stages[0] && !form.getValues('stageId'))
      form.setValue('stageId', pipeline.stages[0].id);
  }, [form, pipeline]);
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    void queryClient.invalidateQueries({ queryKey: ['pipelines'] });
  };
  const move = useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) =>
      apiRequest(`/opportunities/${id}/move`, {
        method: 'POST',
        body: JSON.stringify({ stageId }),
      }),
    onSuccess: () => {
      invalidate();
      toast.success('Oportunidade movida.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível mover a oportunidade.',
      ),
  });
  const create = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest('/opportunities', {
        method: 'POST',
        body: JSON.stringify({ ...values, pipelineId: pipeline?.id }),
      }),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      form.reset({ title: '', value: 0, stageId: pipeline?.stages[0]?.id ?? '' });
      toast.success('Oportunidade criada.');
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : 'Não foi possível criar a oportunidade.',
      ),
  });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const onDragEnd = (event: DragEndEvent) => {
    setActive(null);
    const stageId = event.over?.id?.toString();
    const record = event.active.data.current?.opportunity as Opportunity | undefined;
    if (stageId && record && record.stageId !== stageId) move.mutate({ id: record.id, stageId });
  };
  if (pipelines.isLoading || opportunities.isLoading)
    return <div className="page-loading">Carregando pipeline…</div>;
  if (pipelines.isError || opportunities.isError || !pipeline)
    return <div className="error-state">Não foi possível carregar o pipeline.</div>;
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Vendas</p>
          <h1>Pipeline</h1>
          <p>Arraste oportunidades entre as etapas para atualizar o funil.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> Nova oportunidade
        </Button>
      </header>
      <DndContext
        sensors={sensors}
        onDragStart={(event: DragStartEvent) =>
          setActive(event.active.data.current?.opportunity as Opportunity)
        }
        onDragEnd={onDragEnd}
        onDragCancel={() => setActive(null)}
      >
        <div className="board">
          {pipeline.stages.map((stage) => (
            <BoardColumn key={stage.id} stage={stage}>
              {opportunities.data?.data
                .filter((item) => item.stageId === stage.id)
                .map((item) => (
                  <OpportunityCard key={item.id} opportunity={item} />
                ))}
            </BoardColumn>
          ))}
        </div>
        <DragOverlay>
          {active && (
            <article className="opportunity-card">
              <h3>{active.title}</h3>
              <p>{money.format(Number(active.value))}</p>
            </article>
          )}
        </DragOverlay>
      </DndContext>
      {open && (
        <>
          <button
            className="drawer-backdrop"
            onClick={() => setOpen(false)}
            aria-label="Fechar formulário"
          />
          <aside className="drawer">
            <div className="drawer-header">
              <h2>Nova oportunidade</h2>
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
                  <label>Valor estimado *</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    {...form.register('value', { valueAsNumber: true })}
                  />
                  {form.formState.errors.value && (
                    <small>{form.formState.errors.value.message}</small>
                  )}
                </div>
                <div className="field">
                  <label>Etapa *</label>
                  <select className="select" {...form.register('stageId')}>
                    {pipeline.stages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name} ({stage.probability}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Salvando…' : 'Criar oportunidade'}
                </Button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
