'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../../lib/api-client';
import { useSessionStore } from '../../stores/session-store';

export function RequireSession({ children }: { children: ReactNode }) {
  const session = useSessionStore((state) => state.session);
  const setSession = useSessionStore((state) => state.setSession);
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(!session);

  useEffect(() => {
    if (session) {
      setCheckingSession(false);
      return;
    }
    let active = true;
    void authApi
      .refresh()
      .then((restored) => {
        if (!active) return;
        if (restored) setSession(restored);
        else router.replace('/login');
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, [router, session, setSession]);

  if (checkingSession || !session) return <div className="page-loading">Carregando sessão…</div>;
  return <>{children}</>;
}
