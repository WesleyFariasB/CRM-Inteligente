'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi } from '../lib/api-client';
import { useSessionStore } from '../stores/session-store';

export function useSession() {
  const session = useSessionStore((state) => state.session);
  const clearSession = useSessionStore((state) => state.clearSession);
  const query = useQuery({
    queryKey: ['session'],
    queryFn: authApi.me,
    enabled: Boolean(session),
    retry: false,
    staleTime: 60_000,
  });
  useEffect(() => {
    if (query.isError) clearSession();
  }, [clearSession, query.isError]);
  return query;
}
