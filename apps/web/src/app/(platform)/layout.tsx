import type { ReactNode } from 'react';
import { AppShell } from '../../components/layout/app-shell';
import { RequireSession } from '../../components/layout/require-session';
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession>
      <AppShell>{children}</AppShell>
    </RequireSession>
  );
}
