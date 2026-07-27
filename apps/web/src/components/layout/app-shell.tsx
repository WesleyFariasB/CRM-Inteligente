'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Menu, Search, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { authApi, apiRequest } from '../../lib/api-client';
import { useSessionStore } from '../../stores/session-store';
import { cn } from '../../lib/cn';
import { navItems } from './nav-items';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
}
interface Notification {
  id: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [term, setTerm] = useState('');
  const session = useSessionStore((state) => state.session);
  const clearSession = useSessionStore((state) => state.clearSession);
  const search = useQuery({
    queryKey: ['global-search', term],
    enabled: searchOpen && term.trim().length >= 2,
    queryFn: () => apiRequest<SearchResult[]>(`/search?q=${encodeURIComponent(term)}`),
  });
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest<Notification[]>('/notifications'),
    refetchInterval: 60_000,
  });
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      router.replace('/login');
      toast.success('Sessão encerrada.');
    }
  };
  const unread = notifications.data?.filter((item) => !item.readAt).length ?? 0;
  return (
    <div className="app-frame">
      <aside className={cn('sidebar', menuOpen && 'sidebar-open')}>
        <div className="brand-row">
          <Link href="/app/dashboard" className="brand">
            <span>c</span> CRM Inteligente
          </Link>
          <button
            className="icon-button mobile-only"
            onClick={() => setMenuOpen(false)}
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="side-nav" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn('nav-link', pathname === item.href && 'nav-active')}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link
            href="/app/settings"
            className={cn('nav-link', pathname === '/app/settings' && 'nav-active')}
          >
            <Settings size={18} />
            Configurações
          </Link>
          <button className="nav-link nav-button" onClick={() => void logout()}>
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
      {menuOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Fechar menu"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <button
            className="global-search"
            onClick={() => setSearchOpen(true)}
            aria-label="Abrir pesquisa global"
          >
            <Search size={17} />
            <span>
              Pesquisa global <kbd>⌘ K</kbd>
            </span>
          </button>
          <div className="topbar-actions">
            <button
              className="icon-button notification-button"
              onClick={() => setNotificationsOpen((value) => !value)}
              aria-label="Notificações"
            >
              <Bell size={19} />
              {unread > 0 && <i>{unread > 9 ? '9+' : unread}</i>}
            </button>
            <div className="avatar" title={session?.user.name}>
              {session?.user.name?.slice(0, 2).toUpperCase() ?? 'CR'}
            </div>
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>
      {searchOpen && (
        <div className="modal-backdrop" onMouseDown={() => setSearchOpen(false)}>
          <section className="modal search-modal" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Pesquisa global</h2>
              <button className="icon-button" onClick={() => setSearchOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <InputSearch value={term} onChange={setTerm} />
            <div className="search-results">
              {term.length < 2 ? (
                <p className="empty-inline">Digite ao menos dois caracteres.</p>
              ) : search.isLoading ? (
                <p className="empty-inline">Buscando…</p>
              ) : search.data?.length ? (
                search.data.map((item) => (
                  <Link
                    href={item.href}
                    key={`${item.type}-${item.id}`}
                    onClick={() => setSearchOpen(false)}
                    className="list-row"
                  >
                    <div>
                      <h3>{item.title}</h3>
                      <p>
                        {item.type}
                        {item.subtitle ? ` · ${item.subtitle}` : ''}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="empty-inline">Nenhum resultado encontrado.</p>
              )}
            </div>
          </section>
        </div>
      )}
      {notificationsOpen && (
        <aside className="popover notifications-popover">
          <div className="section-heading">
            <div>
              <h2>Notificações</h2>
              <p>{unread} não lida(s)</p>
            </div>
            <button className="icon-button" onClick={() => setNotificationsOpen(false)}>
              <X size={17} />
            </button>
          </div>
          <div className="activity-list">
            {notifications.data?.length ? (
              notifications.data.slice(0, 6).map((item) => (
                <button
                  className="list-row notification-row"
                  key={item.id}
                  onClick={() =>
                    void apiRequest(`/notifications/${item.id}/read`, { method: 'PATCH' }).then(
                      () => notifications.refetch(),
                    )
                  }
                >
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </div>
                  {!item.readAt && <i className="unread-dot" />}
                </button>
              ))
            ) : (
              <p className="empty-inline">Nenhuma notificação por enquanto.</p>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

function InputSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <input
      className="input"
      autoFocus
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Leads, empresas, oportunidades ou tarefas"
    />
  );
}
