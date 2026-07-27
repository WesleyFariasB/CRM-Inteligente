# CRM Inteligente

CRM multiempresa para captação, relacionamento e vendas. Esta versão reúne autenticação, RBAC, isolamento por organização, leads, empresas, contatos, pipeline, tarefas, relatórios, notificações, automações e auditoria.

## Stack

- Web: Next.js, React, TypeScript, Tailwind, TanStack Query/Table, React Hook Form, Zod, Zustand, Recharts e Lucide.
- API: NestJS REST, Prisma, PostgreSQL, JWT, refresh token rotativo em cookie HttpOnly, Argon2id e Swagger.
- Operação: Docker Compose com PostgreSQL/Redis, migrations Prisma, Jest, Supertest, Cypress e GitHub Actions.

## Início local

```powershell
Copy-Item .env.example .env
docker compose up -d postgres redis
npm ci
npm run db:generate
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:3001/api/v1/health`
- OpenAPI/Swagger: `http://localhost:3001/docs` em desenvolvimento

Crie a primeira organização em `/register`. Esse usuário recebe o papel `OWNER` e o pipeline padrão.

## Qualidade

```powershell
npm run format:check
npm run lint
npm run type-check
npm run test
npm run test:e2e
npm run build
```

O smoke E2E do navegador está em `apps/web/cypress/e2e`; com API/web locais ativos, execute `npm run test:e2e --workspace=@crm/web`.

## Segurança e multiempresa

Todo registro de negócio contém `organizationId`, e os serviços filtram esse escopo a partir do token, nunca de dados enviados pelo cliente. O backend aplica permissões por guard, registra ações auditáveis e usa soft delete nos agregados aplicáveis. Tokens de acesso ficam apenas em memória no browser; a recuperação de sessão usa cookie HttpOnly rotativo.

Antes da produção, defina segredos JWT exclusivos, `COOKIE_SECURE=true`, CORS real, HTTPS, backup do PostgreSQL, Redis gerenciado e um provedor de e-mail para convites/recuperação de senha.

## Dependências auditadas

`npm audit --omit=dev` está registrado no CI. Na data desta entrega, o registro do npm ainda sinaliza três alertas altos sem atualização compatível para o pacote interno `postcss`/`sharp` distribuído pelo Next.js 16.2.12; o restante das dependências de produção foi atualizado. Não há `npm audit fix` seguro para eles sem retroceder o Next para uma versão incompatível. Acompanhe a correção upstream antes do deploy público.
