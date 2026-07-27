'use client';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  UsersRound,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiRequest } from '../../lib/api-client';
import { Card } from '../../components/ui/card';
interface DashboardData {
  metrics: Record<string, number>;
  funnel: Array<{ id: string; name: string; color: string; probability: number; count: number }>;
  leadSources: Array<{ name: string; value: number }>;
  upcomingActivities: Array<{
    id: string;
    type: string;
    title: string;
    scheduledAt: string;
    status: string;
  }>;
}
const metricConfig = [
  { key: 'leadsTotal', label: 'Leads ativos', icon: UsersRound },
  { key: 'opportunitiesOpen', label: 'Oportunidades abertas', icon: CircleDollarSign },
  { key: 'revenueForecast', label: 'Receita prevista', icon: ArrowUpRight },
  { key: 'overdueTasks', label: 'Tarefas atrasadas', icon: ArrowDownRight },
];
const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
});
export function DashboardView() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest<DashboardData>('/dashboard/summary'),
  });
  if (isLoading) return <div className="page-loading">Carregando indicadores…</div>;
  if (error || !data)
    return (
      <div className="error-state">
        Não foi possível carregar o dashboard. Verifique sua sessão e a conexão com a API.
      </div>
    );
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1>Seu funil em movimento</h1>
          <p>Indicadores atualizados da sua operação comercial.</p>
        </div>
        <span className="date-chip">
          <CalendarDays size={16} />
          Hoje
        </span>
      </header>
      <section className="metric-grid">
        {metricConfig.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="metric-card">
            <div className="metric-icon">
              <Icon size={18} />
            </div>
            <p>{label}</p>
            <strong>
              {key === 'revenueForecast'
                ? money.format(data.metrics[key] ?? 0)
                : (data.metrics[key] ?? 0)}
            </strong>
            {key === 'leadsTotal' && (
              <span className="metric-note">{data.metrics.newLeads} novos neste mês</span>
            )}
            {key === 'overdueTasks' && (
              <span className="metric-note">{data.metrics.pendingTasks} pendentes</span>
            )}
          </Card>
        ))}
      </section>
      <section className="dashboard-grid">
        <Card className="chart-card">
          <div className="section-heading">
            <div>
              <h2>Pipeline de vendas</h2>
              <p>Oportunidades por etapa</p>
            </div>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={data.funnel}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#7b8aa8', fontSize: 11 }}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#7b8aa8' }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #26334e',
                    background: '#121c30',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {data.funnel.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="chart-card">
          <div className="section-heading">
            <div>
              <h2>Origem dos leads</h2>
              <p>Canais que trazem mais oportunidades</p>
            </div>
          </div>
          <div className="chart-area split-chart">
            <ResponsiveContainer width="55%" height={240}>
              <PieChart>
                <Pie
                  data={data.leadSources}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={83}
                  paddingAngle={4}
                >
                  {data.leadSources.map((_, index) => (
                    <Cell
                      key={index}
                      fill={['#53d5c8', '#7c83ff', '#f8b84e', '#ed7095', '#8dce67'][index % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #26334e',
                    background: '#121c30',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="chart-legend">
              {data.leadSources.map((item, index) => (
                <li key={item.name}>
                  <i
                    style={{
                      background: ['#53d5c8', '#7c83ff', '#f8b84e', '#ed7095', '#8dce67'][
                        index % 5
                      ],
                    }}
                  />
                  {item.name}
                  <strong>{item.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>
      <Card>
        <div className="section-heading">
          <div>
            <h2>Próximas atividades</h2>
            <p>Agenda dos próximos sete dias</p>
          </div>
        </div>
        <div className="activity-list">
          {data.upcomingActivities.length ? (
            data.upcomingActivities.map((activity) => (
              <div key={activity.id} className="activity-row">
                <span className="activity-type">{activity.type}</span>
                <div>
                  <strong>{activity.title}</strong>
                  <p>{new Date(activity.scheduledAt).toLocaleString('pt-BR')}</p>
                </div>
                <span className="status-pill">{activity.status}</span>
              </div>
            ))
          ) : (
            <p className="empty-inline">Nenhuma atividade programada.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
