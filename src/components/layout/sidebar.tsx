"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/constants/navigation";
import { cn } from "@/lib/utils";

type SidebarProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        "border-r border-zinc-800 bg-zinc-950",
        mobile ? "h-full w-72" : "hidden w-72 shrink-0 xl:block",
      )}
    >
      <div className="flex h-20 items-center border-b border-zinc-800 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-sm font-semibold text-emerald-200">
            WF
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
              Portfólio pessoal
            </p>
            <h1 className="text-xl font-semibold text-white">
              CRM - Wesley Farias
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 pb-2 pt-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-sm font-medium text-white">Frontend Developer</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            Interfaces em React, dashboards e experiências digitais com foco em
            clareza.
          </p>
        </div>
      </div>

      <nav className="space-y-2 p-4">
        {navigationItems.map((item) => (
          <SidebarLink
            key={item.title}
            title={item.title}
            href={item.href}
            icon={item.icon}
            disabled={item.disabled}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </aside>
  );
}

type SidebarLinkProps = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  onNavigate?: () => void;
};

function SidebarLink({
  title,
  href,
  icon: Icon,
  disabled,
  onNavigate,
}: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (disabled) {
    return (
      <div className="flex cursor-not-allowed items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-500">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition",
        isActive
          ? "border-emerald-400/40 bg-emerald-400/10 text-white"
          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800",
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{title}</span>
    </Link>
  );
}
