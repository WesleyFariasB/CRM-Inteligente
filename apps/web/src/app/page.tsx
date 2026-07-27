import Link from 'next/link';
export default function HomePage() {
  return (
    <main className="marketing">
      <section>
        <p className="eyebrow">CRM Inteligente</p>
        <h1>Relacionamentos comerciais, sem pontos cegos.</h1>
        <p className="lead">
          Uma operação unificada para captar, conduzir e transformar oportunidades em receita.
        </p>
        <div className="hero-actions">
          <Link className="button button-primary button-lg" href="/register">
            Criar organização
          </Link>
          <Link className="button button-secondary button-lg" href="/login">
            Entrar
          </Link>
        </div>
      </section>
      <aside className="marketing-card">
        <p>Uma plataforma pronta para o time comercial</p>
        <ul>
          <li>Leads e contatos em contexto</li>
          <li>Pipeline com atualização em tempo real</li>
          <li>Relatórios e automações auditáveis</li>
        </ul>
      </aside>
    </main>
  );
}
