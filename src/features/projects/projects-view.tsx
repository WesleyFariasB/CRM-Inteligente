"use client";

import { useSyncExternalStore } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const projectTrend = [
  { month: "Jan", interface: 18, dados: 12 },
  { month: "Fev", interface: 25, dados: 19 },
  { month: "Mar", interface: 36, dados: 27 },
  { month: "Abr", interface: 48, dados: 35 },
  { month: "Mai", interface: 62, dados: 47 },
  { month: "Jun", interface: 78, dados: 58 },
];

const projects = [
  {
    name: "Painel de relacionamento",
    role: "Frontend e UX",
    stack: "Next.js, React, Recharts",
    result: "Dashboard responsivo com indicadores, navegação lateral e cards reutilizáveis.",
  },
  {
    name: "Experiência de portfólio",
    role: "Produto e interface",
    stack: "TypeScript, Tailwind CSS",
    result: "Reposicionamento de um produto SaaS para apresentação profissional pessoal.",
  },
  {
    name: "Sistema visual escalável",
    role: "Design system",
    stack: "Componentes, tokens, layout",
    result: "Base de UI consistente para evoluir novas telas sem duplicar padrões.",
  },
];

const metrics = [
  { label: "Projetos em destaque", value: "3" },
  { label: "Componentes base", value: "4" },
  { label: "Rotas principais", value: "3" },
];

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ProjectsView() {
  const chartReady = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Badge variant="info">Projetos</Badge>
          <h1 className="text-3xl font-semibold text-zinc-950">
            Trabalhos e estudos de caso
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-600">
            Uma visão objetiva das entregas que este portfólio demonstra:
            interface, organização de código, responsividade e leitura de dados.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            toast.info("Adicione aqui o link público do currículo do Wesley.")
          }
        >
          Currículo
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((item) => (
          <Card key={item.label}>
            <CardContent className="space-y-2">
              <p className="text-sm text-zinc-500">{item.label}</p>
              <strong className="text-3xl text-zinc-950">{item.value}</strong>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução do projeto</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          {chartReady ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectTrend}>
                <CartesianGrid stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="interface"
                  stroke="#059669"
                  strokeWidth={3}
                />
                <Line
                  type="monotone"
                  dataKey="dados"
                  stroke="#d97706"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-lg bg-zinc-50" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projetos destacados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {projects.map((item) => (
            <div
              key={item.name}
              className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-[1.2fr_0.9fr_1fr_1.5fr]"
            >
              <span className="text-sm font-medium text-zinc-950">
                {item.name}
              </span>
              <span className="text-sm text-zinc-600">{item.role}</span>
              <span className="text-sm text-zinc-600">{item.stack}</span>
              <span className="text-sm leading-6 text-zinc-600">
                {item.result}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
