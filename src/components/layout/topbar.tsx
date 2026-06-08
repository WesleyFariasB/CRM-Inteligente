"use client";

import { Menu } from "lucide-react";

type TopbarProps = {
  onMenuClick: () => void;
};

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-900 xl:hidden"
          aria-label="Abrir navegação"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Portfólio pessoal
          </p>
          <h2 className="text-lg font-semibold text-zinc-950">
            CRM - Wesley Farias
          </h2>
        </div>
      </div>

      <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
        Apresentação profissional
      </div>
    </header>
  );
}
