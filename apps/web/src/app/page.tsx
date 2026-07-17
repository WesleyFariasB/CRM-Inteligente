import { FoundationStatus } from '../components/foundation-status';

const foundations = [
  {
    title: 'Monorepo modular',
    description:
      'Web, API e contratos compartilhados independentes, com limites claros de responsabilidade.',
  },
  {
    title: 'Multiempresa desde a base',
    description:
      'O modelo inicial contém organizações; os próximos módulos receberão tenant obrigatório em toda consulta.',
  },
  {
    title: 'API segura por padrão',
    description:
      'Validação global, CORS restritivo, Helmet, rate limiting e respostas de erro padronizadas.',
  },
  {
    title: 'Operação reproduzível',
    description:
      'Docker Compose, variáveis versionadas por exemplo, health check e workflow de CI já configurados.',
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">CRM Inteligente · Etapa 1</p>
        <h1 id="page-title">Uma fundação segura para relações que crescem.</h1>
        <p className="lead">
          A arquitetura está pronta para autenticação, permissões e os módulos de operação comercial
          nas próximas etapas.
        </p>
        <div className="health-row" role="status">
          <span className="health-dot" aria-hidden="true" />
          Estrutura inicial operacional
        </div>
      </section>

      <section className="foundation-grid" aria-label="Pilares da arquitetura">
        {foundations.map((foundation) => (
          <FoundationStatus key={foundation.title} {...foundation} />
        ))}
      </section>
    </main>
  );
}
