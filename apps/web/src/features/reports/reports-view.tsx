'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../../components/ui/card';
import { apiRequest } from '../../lib/api-client';

interface ReportData {
  pipeline: Array<{ stage: string; color: string; count: number; value: number }>;
  sellers: Array<{ seller: string; count: number; value: number }>;
  lostReasons: Array<{ reason: string; count: number }>;
}
const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
export function ReportsView() {
  const query = useQuery({
    queryKey: ['reports', 'sales'],
    queryFn: () => apiRequest<ReportData>('/reports/sales'),
  });
  if (query.isLoading) return <div className="page-loading">Calculando relatórios…</div>;
  if (query.isError || !query.data)
    return <div className="error-state">Não foi possível carregar os relatórios.</div>;
  const { pipeline, sellers, lostReasons } = query.data;
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Inteligência comercial</p>
          <h1>Relatórios</h1>
          <p>Leia o desempenho do funil e identifique o próximo ajuste.</p>
        </div>
      </header>
      <section className="report-grid">
        <Card className="chart-card">
          <div className="section-heading">
            <div>
              <h2>Valor por etapa</h2>
              <p>Previsão concentrada no funil</p>
            </div>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipeline}>
                <XAxis
                  dataKey="stage"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#96a2bb', fontSize: 11 }}
                />
                <YAxis
                  tickFormatter={(value) => `R$ ${Math.round(value / 1000)}k`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#96a2bb', fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => money.format(Number(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #26334e',
                    background: '#121c30',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {pipeline.map((item, index) => (
                    <Cell key={index} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="section-heading">
            <div>
              <h2>Conversão por etapa</h2>
              <p>Quantidade de oportunidades</p>
            </div>
          </div>
          <div className="activity-list">
            {pipeline.length ? (
              pipeline.map((item) => (
                <div className="activity-row" key={item.stage}>
                  <span className="activity-type" style={{ borderColor: item.color }}>
                    {item.count}
                  </span>
                  <div>
                    <strong>{item.stage}</strong>
                    <p>{money.format(item.value)} em valor estimado</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-inline">Ainda não há oportunidades.</p>
            )}
          </div>
        </Card>
        <Card>
          <div className="section-heading">
            <div>
              <h2>Desempenho por responsável</h2>
              <p>Volume e valor em negociação</p>
            </div>
          </div>
          <div className="activity-list">
            {sellers.length ? (
              sellers.map((item) => (
                <div className="activity-row" key={item.seller}>
                  <span className="activity-type">{item.count}</span>
                  <div>
                    <strong>{item.seller}</strong>
                    <p>{money.format(item.value)} em oportunidades</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-inline">Ainda não há responsáveis em oportunidades.</p>
            )}
          </div>
        </Card>
        <Card>
          <div className="section-heading">
            <div>
              <h2>Motivos de perda</h2>
              <p>Use estes sinais para melhorar a oferta.</p>
            </div>
          </div>
          <div className="activity-list">
            {lostReasons.length ? (
              lostReasons.map((item) => (
                <div className="activity-row" key={item.reason}>
                  <span className="activity-type">{item.count}</span>
                  <div>
                    <strong>{item.reason}</strong>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-inline">Nenhuma perda registrada.</p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
