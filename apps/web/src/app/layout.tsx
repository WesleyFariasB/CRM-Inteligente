import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { AppProviders } from '../providers/app-providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRM Inteligente',
  description: 'CRM multiempresa seguro e escalável.',
};

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#0b1220',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
