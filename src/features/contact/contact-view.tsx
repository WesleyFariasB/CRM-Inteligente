"use client";

import { CheckCircle2, Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const email = "wesley_Farias7@outlook.com";

const capabilities = [
  { name: "React e Next.js", value: 90 },
  { name: "TypeScript", value: 84 },
  { name: "UI responsiva", value: 88 },
  { name: "Dashboards e dados", value: 80 },
];

const workflow = [
  "Entendo o objetivo do produto antes de desenhar a tela.",
  "Organizo a interface em componentes reutilizáveis e fáceis de manter.",
  "Valido responsividade, estados visuais e clareza da experiência.",
];

export default function ContactView() {
  function copyEmail() {
    void navigator.clipboard.writeText(email);
    toast.success("E-mail copiado para a área de transferência.");
  }

  function openEmail() {
    window.location.href = `mailto:${email}`;
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <Badge variant="success">Contato</Badge>
        <h1 className="text-3xl font-semibold text-zinc-950">
          Vamos conversar
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-zinc-600">
          Entre em contato para projetos frontend, melhorias de interface,
          dashboards ou evolução de produtos web.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Contato direto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">E-mail profissional</p>
                  <strong className="break-all text-base text-zinc-950">
                    {email}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="gap-2" onClick={openEmail}>
                <Mail className="h-4 w-4" />
                Enviar e-mail
              </Button>
              <Button className="gap-2" variant="outline" onClick={copyEmail}>
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como posso contribuir</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {workflow.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700"
              >
                <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-600" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stack de trabalho</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          {capabilities.map((item) => (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-zinc-800">{item.name}</span>
                <span className="text-zinc-500">{item.value}%</span>
              </div>
              <Progress value={item.value} />
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
