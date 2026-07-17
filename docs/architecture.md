# Arquitetura

## Decisão estrutural

O CRM usa um monorepo npm simples e explícito. `apps/web` e `apps/api` podem evoluir e ser implantados de forma independente; `packages/*` contém apenas contratos e utilitários sem regras de domínio. Isso mantém a primeira entrega leve, sem introduzir Turborepo antes de existir demanda de cache ou múltiplos pipelines.

## Módulos da API

Cada domínio futuro seguirá `modules/<domínio>/` com controller, DTOs, service/use cases, repository, policies e testes. Controllers traduzem HTTP; regras de negócio vivem nos casos de uso; repositórios são a única camada que conversa com Prisma. A API expõe `/api/v1` e reserva `/docs` para Swagger em ambientes autorizados.

```text
src/
  common/               # filtros, guards, decorators e utilitários sem domínio
  config/               # ambiente tipado e configurações
  database/             # Prisma, transações e escopo de tenant
  modules/
    auth/ users/ roles/ teams/
    leads/ contacts/ companies/
    pipelines/ opportunities/
    activities/ tasks/ notifications/
    automations/ reports/ audit-logs/ settings/
```

## Multiempresa

`Organization` é a raiz do modelo. A partir da Etapa 2, todo agregado de negócio terá `organizationId` não nulo, índice composto começando por ele e repositórios que recebem o contexto autenticado do tenant. O identificador de tenant nunca virá livremente de query string ou body. As policies também verificam papel, pertencimento à equipe e propriedade do registro. Testes de integração devem provar que registros de outra organização retornam 404, não apenas que ficam ocultos na interface.

## Autenticação e autorização

Na Etapa 2, senhas serão armazenadas com Argon2id. Access tokens curtos serão entregues por Bearer token e refresh tokens rotativos em cookie `HttpOnly`, `Secure` e `SameSite` apropriado. Sessões serão persistidas, revogáveis e vinculadas a organização/dispositivo.

Na Etapa 3, RBAC será composto por `Role`, `Permission` e associação de usuário por organização. Decorators declaram a permissão exigida; guards e policies a avaliam no servidor. A UI usa as permissões somente como melhoria de experiência, nunca como fronteira de segurança.

## Modelo de dados inicial

O schema inicial cria `Organization` como ponto de partida. A evolução prevista introduz `User`, `Membership`, `Session`, `Role`, `Permission`, `Team`, `Lead`, `Company`, `Contact`, `Opportunity`, `Pipeline`, `PipelineStage`, `Activity`, `Task`, `Note`, `Tag`, `Notification`, `Automation` e `AuditLog`. Todas as entidades de negócio terão timestamps, estratégias de soft delete quando aplicável, FKs explícitas e índices para `organizationId`, filtros e ordenação.

## Front-end

Next.js App Router privilegia Server Components. Providers de dados ficam no limite mínimo necessário; TanStack Query será responsável por cache de API e Zustand apenas por estado de interface. As features futuras ficam em `src/features/<domínio>` com schema Zod, client de API, hooks e componentes de domínio separados de `components/ui`.

## Observabilidade e deploy

Cada serviço tem health check. O próximo incremento adiciona readiness de banco/Redis e logs estruturados com request ID. A implantação prevista é web na Vercel e API em plataforma de containers gerenciada, com PostgreSQL e Redis gerenciados, segredos no provedor e ambientes separados para desenvolvimento, homologação e produção.
