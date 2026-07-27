'use client';

import { create } from 'zustand';
import type { AuthSession } from '../lib/api-client';
import { setAccessToken } from '../lib/api-client';

interface SessionState {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  session: null,
  setSession: (session) => {
    setAccessToken(session.accessToken);
    set({ session });
  },
  clearSession: () => {
    setAccessToken(null);
    set({ session: null });
  },
}));
