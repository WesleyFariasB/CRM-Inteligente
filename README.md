# CRM Inteligente

Base de um CRM multiempresa, seguro e modular. Esta primeira entrega implementa a infraestrutura de desenvolvimento: monorepo npm, aplicação web Next.js, API NestJS, Prisma/PostgreSQL, Redis, Docker Compose, testes e CI.

## Arquitetura

```text
apps/
  api/                 # REST API NestJS e Prisma
  web/                 # Next.js App Router
packages/
  config/              # Constantes compartilhadas
  types/               # Contratos TypeScript compartilhados
  ui/                  # Primitivos visuais compartilhados (evolui na etapa 4)
docs/
  architecture.md      # Decisões e fronteiras técnicas
  roadmap.md           # Entregas incrementais
  security.md          # Controles de segurança
```

Leia [a arquitetura](docs/architecture.md), [o roadmap](docs/roadmap.md) e [os controles de segurança](docs/security.md) antes de iniciar um módulo de negócio.

## Requisitos

- Node.js 24+
- npm 10+
- Docker Desktop (recomendado para PostgreSQL e Redis)

## Início rápido

```bash
Copy-Item .env.example .env
npm install
docker compose up -d postgres redis
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api/v1/health`
- Swagger (desenvolvimento): `http://localhost:3001/docs`

Para executar tudo em containers, use `docker compose up --build`.

## Qualidade

```bash
npm run format:check
npm run lint
npm run type-check
npm run test
npm run test:e2e
npm run build
```

## Variáveis de ambiente

O arquivo [.env.example](.env.example) lista todas as variáveis locais. Nunca versione `.env`, tokens, chaves ou credenciais de produção.

## Escopo atual

Esta entrega é intencionalmente apenas a Etapa 1. Autenticação, RBAC, isolamento aplicado às consultas, telas de CRM e automações entram nas etapas subsequentes, sempre com testes e migrações próprias.
