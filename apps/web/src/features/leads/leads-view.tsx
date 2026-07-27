'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { ApiError, apiRequest } from '../../lib/api-client';

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status: string;
  temperature: string;
  score: number;
  assignee?: { name: string } | null;
  company?: { name: string } | null;
  createdAt: string;
}
interface Paged<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
const leadSchema = z.object({
  name: z.string().min(2, 'Informe o nome.'),
  email: z.union([z.literal(''), z.email('Informe um e-mail válido.')]),
  phone: z.string().max(40).optional(),
  source: z.string().max(80).optional(),
  temperature: z.enum(['COLD', 'WARM', 'HOT']),
  interest: z.string().max(500).optional(),
  notes: z.string().max(5000).optional(),
});
type LeadForm = z.infer<typeof leadSchema>;
const column = createColumnHelper<Lead>();

function statusClass(status: string) {
  return `status-pill status-${status.toLowerCase()}`;
}
function humanize(value: string) {
  return value.toLowerCase().replaceAll('_', ' ');
}

export function LeadsView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [drawer, setDrawer] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['leads', page, search],
    queryFn: () =>
      apiRequest<Paged<Lead>>(`/leads?page=${page}&limit=12&search=${encodeURIComponent(search)}`),
  });
  const form = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { temperature: 'WARM' },
  });
  const create = useMutation({
    mutationFn: (values: LeadForm) =>
      apiRequest<Lead>('/leads', {
        method: 'POST',
        body: JSON.stringify({ ...values, email: values.email || undefined }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      form.reset({ temperature: 'WARM' });
      setDrawer(false);
      toast.success('Lead cadastrado.');
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Não foi possível cadastrar o lead.'),
  });
  const archive = useMutation({
    mutationFn: (id: string) => apiRequest(`/leads/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead arquivado.');
    },
    onError: () => toast.error('Não foi possível arquivar o lead.'),
  });
  const columns = [
    column.accessor('name', {
      header: 'Lead',
      cell: ({ row, getValue }) => (
        <div className="record-title">
          {getValue()}
          <span className="record-subtitle">
            {row.original.email || row.original.phone || 'Sem contato'}
          </span>
        </div>
      ),
    }),
    column.accessor('company', {
      header: 'Empresa',
      cell: ({ getValue }) => getValue()?.name || '—',
    }),
    column.accessor('source', { header: 'Origem', cell: ({ getValue }) => getValue() || '—' }),
    column.accessor('temperature', {
      header: 'Temperatura',
      cell: ({ getValue }) => <span className="tag">{humanize(getValue())}</span>,
    }),
    column.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={statusClass(getValue())}>{humanize(getValue())}</span>
      ),
    }),
    column.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => archive.mutate(row.original.id)}>
          Arquivar
        </Button>
      ),
    }),
  ];
  const table = useReactTable({
    data: query.data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const meta = query.data?.meta;
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Captação</p>
          <h1>Leads</h1>
          <p>Centralize, qualifique e acompanhe cada novo contato.</p>
        </div>
        <Button onClick={() => setDrawer(true)}>
          <Plus size={16} /> Novo lead
        </Button>
      </header>
      <div className="toolbar">
        <div className="toolbar-group">
          <Search size={18} />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome, e-mail ou telefone"
          />
        </div>
        <span className="tag">{meta?.total ?? 0} registros</span>
      </div>
      <section className="card data-card">
        {query.isLoading ? (
          <div className="page-loading">Carregando leads…</div>
        ) : query.isError ? (
          <div className="error-state">Não foi possível carregar os leads.</div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  {table.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => (
                        <th key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {!table.getRowModel().rows.length && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">Nenhum lead encontrado.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                Página {meta?.page ?? 1} de {meta?.totalPages ?? 1}
              </span>
              <div className="pagination-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta || page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta || page >= meta.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
      {drawer && (
        <>
          <button
            className="drawer-backdrop"
            aria-label="Fechar formulário"
            onClick={() => setDrawer(false)}
          />
          <aside className="drawer">
            <div className="drawer-header">
              <h2>Novo lead</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDrawer(false)}
                aria-label="Fechar"
              >
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
                  <label>E-mail</label>
                  <Input type="email" {...form.register('email')} />
                  {form.formState.errors.email && (
                    <small>{form.formState.errors.email.message}</small>
                  )}
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <Input {...form.register('phone')} />
                </div>
                <div className="field">
                  <label>Origem</label>
                  <Input placeholder="Indicação, site, campanha…" {...form.register('source')} />
                </div>
                <div className="field">
                  <label>Temperatura</label>
                  <select className="select" {...form.register('temperature')}>
                    <option value="COLD">Frio</option>
                    <option value="WARM">Morno</option>
                    <option value="HOT">Quente</option>
                  </select>
                </div>
                <div className="field">
                  <label>Interesse</label>
                  <Input {...form.register('interest')} />
                </div>
              </div>
              <div className="field" style={{ marginTop: '0.85rem' }}>
                <label>Observações</label>
                <textarea className="textarea" {...form.register('notes')} />
              </div>
              {create.error instanceof ApiError && (
                <p className="form-error">{create.error.message}</p>
              )}
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => setDrawer(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Salvando…' : 'Salvar lead'}
                </Button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
