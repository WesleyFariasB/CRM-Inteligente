'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { apiRequest } from '../../lib/api-client';

type DirectoryKind = 'companies' | 'contacts';
interface Paged<T> {
  data: T[];
  meta: { page: number; total: number; totalPages: number };
}
interface DirectoryRecord {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  segment?: string | null;
  jobTitle?: string | null;
  website?: string | null;
  company?: { name: string } | null;
  _count?: { contacts?: number; opportunities?: number };
}
const schema = z.object({
  name: z.string().min(2, 'Informe o nome.'),
  email: z.union([z.literal(''), z.email('Informe um e-mail válido.')]),
  phone: z.string().max(40).optional(),
  detail: z.string().max(120).optional(),
  website: z.string().max(300).optional(),
});
type FormValues = z.infer<typeof schema>;
const copy = {
  companies: {
    title: 'Empresas',
    eyebrow: 'Base comercial',
    description: 'Consolide contas, contexto e relacionamentos.',
    newLabel: 'Nova empresa',
    detail: 'Segmento',
    detailPlaceholder: 'Tecnologia, varejo…',
  },
  contacts: {
    title: 'Contatos',
    eyebrow: 'Relacionamentos',
    description: 'Mantenha as pessoas certas próximas das oportunidades.',
    newLabel: 'Novo contato',
    detail: 'Cargo',
    detailPlaceholder: 'Diretora comercial…',
  },
} as const;

export function DirectoryView({ kind }: { kind: DirectoryKind }) {
  const labels = copy[kind];
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [kind, page, search],
    queryFn: () =>
      apiRequest<Paged<DirectoryRecord>>(
        `/${kind}?page=${page}&limit=12&search=${encodeURIComponent(search)}`,
      ),
  });
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const create = useMutation({
    mutationFn: (values: FormValues) => {
      const body =
        kind === 'companies'
          ? {
              name: values.name,
              email: values.email || undefined,
              phone: values.phone,
              segment: values.detail,
              website: values.website,
            }
          : {
              name: values.name,
              email: values.email || undefined,
              phone: values.phone,
              jobTitle: values.detail,
            };
      return apiRequest(`/${kind}`, { method: 'POST', body: JSON.stringify(body) });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [kind] });
      form.reset();
      setOpen(false);
      toast.success(`${kind === 'companies' ? 'Empresa' : 'Contato'} cadastrado.`);
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o registro.'),
  });
  const archive = useMutation({
    mutationFn: (id: string) => apiRequest(`/${kind}/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [kind] });
      toast.success('Registro arquivado.');
    },
  });
  const meta = query.data?.meta;
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{labels.eyebrow}</p>
          <h1>{labels.title}</h1>
          <p>{labels.description}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          {labels.newLabel}
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
            placeholder={`Buscar ${kind === 'companies' ? 'empresa' : 'contato'}`}
          />
        </div>
        <span className="tag">{meta?.total ?? 0} registros</span>
      </div>
      <section className="card data-card">
        {query.isLoading ? (
          <div className="page-loading">Carregando…</div>
        ) : query.isError ? (
          <div className="error-state">Não foi possível carregar os registros.</div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{kind === 'companies' ? 'Empresa' : 'Contato'}</th>
                    <th>{labels.detail}</th>
                    <th>Contato</th>
                    <th>Relacionamentos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {query.data?.data.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <div className="record-title">
                          {record.name}
                          <span className="record-subtitle">
                            {kind === 'contacts'
                              ? record.company?.name || 'Sem empresa'
                              : record.website || 'Sem site informado'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {kind === 'companies' ? record.segment || '—' : record.jobTitle || '—'}
                      </td>
                      <td>{record.email || record.phone || '—'}</td>
                      <td>
                        {kind === 'companies'
                          ? `${record._count?.contacts ?? 0} contatos`
                          : record.company?.name || '—'}
                      </td>
                      <td>
                        <Button size="sm" variant="ghost" onClick={() => archive.mutate(record.id)}>
                          Arquivar
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!query.data?.data.length && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">Nenhum registro encontrado.</div>
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
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
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
      {open && (
        <>
          <button
            className="drawer-backdrop"
            aria-label="Fechar formulário"
            onClick={() => setOpen(false)}
          />
          <aside className="drawer">
            <div className="drawer-header">
              <h2>{labels.newLabel}</h2>
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
                  <label>{labels.detail}</label>
                  <Input placeholder={labels.detailPlaceholder} {...form.register('detail')} />
                </div>
                {kind === 'companies' && (
                  <div className="field">
                    <label>Site</label>
                    <Input placeholder="https://" {...form.register('website')} />
                  </div>
                )}
              </div>
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
