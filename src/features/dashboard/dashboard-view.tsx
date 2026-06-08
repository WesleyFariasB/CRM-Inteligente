"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const expertiseTrend = [
  { month: "Jan", frontend: 54, produto: 38 },
  { month: "Fev", frontend: 61, produto: 44 },
  { month: "Mar", frontend: 68, produto: 53 },
  { month: "Abr", frontend: 74, produto: 61 },
  { month: "Mai", frontend: 82, produto: 68 },
  { month: "Jun", frontend: 90, produto: 76 },
];

const focusData = [
  { area: "React", total: 92 },
  { area: "Next", total: 88 },
  { area: "UI/UX", total: 84 },
  { area: "Dados", total: 79 },
  { area: "Qualid.", total: 74 },
];

const kpis = [
  { label: "Atuação", value: "Frontend", tag: "React/Next" },
  { label: "Foco", value: "Dashboards", tag: "Dados" },
  { label: "Entrega", value: "UI responsiva", tag: "UX" },
  { label: "Contato", value: "Aberto", tag: "E-mail" },
];

const highlights = [
  "Projeto reposicionado como portfólio pessoal, sem vínculo visual com a marca anterior.",
  "Arquitetura organizada por features, componentes de UI e layout reutilizável.",
  "Interface preparada para receber currículo, links públicos e novos estudos de caso.",
];

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function DashboardView() {
  const chartsReady = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <header className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <Badge variant="info">Portfólio pessoal</Badge>
          <div className="mt-5 max-w-3xl space-y-4">
            <h1 className="text-3xl font-semibold text-zinc-950 md:text-4xl">
              Wesley Farias
            </h1>
            <p className="text-base leading-7 text-zinc-600">
              Desenvolvedor frontend com foco em interfaces modernas,
              dashboards responsivos e experiências digitais claras. Este projeto
              agora funciona como uma vitrine pessoal de código, UI e produto.
            </p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="border-t border-zinc-200 pt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Stack principal
              </p>
              <strong className="mt-2 block text-lg text-zinc-950">
                Next.js, React, TypeScript
              </strong>
            </div>
            <div className="border-t border-zinc-200 pt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Especialidade
              </p>
              <strong className="mt-2 block text-lg text-zinc-950">
                Produtos web orientados por dados
              </strong>
            </div>
          </div>
        </header>

        <div className="relative min-h-[320px] overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm">
          <Image
            src="/portfolio-hero.png"
            alt="Workspace profissional com dashboard abstrato em um laptop"
            fill
            priority
            sizes="(min-width: 1280px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-500">{item.label}</p>
              <div className="flex items-end justify-between gap-3">
                <strong className="text-2xl text-zinc-950">{item.value}</strong>
                <Badge variant="success">{item.tag}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de competências</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={expertiseTrend}>
                  <CartesianGrid stroke="#e4e4e7" vertical={false} />
                  <XAxis dataKey="month" stroke="#71717a" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="frontend"
                    stroke="#059669"
                    fill="#059669"
                    fillOpacity={0.16}
                  />
                  <Area
                    type="monotone"
                    dataKey="produto"
                    stroke="#d97706"
                    fill="#d97706"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-lg bg-zinc-50" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Destaques do projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {highlights.map((highlight) => (
              <div
                key={highlight}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700"
              >
                {highlight}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Áreas de foco</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={focusData}>
                <CartesianGrid stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="area" stroke="#71717a" />
                <Tooltip />
                <Bar dataKey="total" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-lg bg-zinc-50" />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
