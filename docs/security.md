# Segurança por padrão

- Ambiente validado com Zod e bloqueio de segredos JWT de desenvolvimento em produção.
- `Helmet`, CORS por allow-list, limite global de requisições e `ValidationPipe` com whitelist bloqueiam vetores básicos antes de os módulos existirem.
- O filtro global retorna mensagens públicas padronizadas; detalhes internos não são enviados ao cliente.
- A API reserva DTOs específicos por ação. A partir da Etapa 2 não haverá DTO genérico para alteração de campos sensíveis.
- Prisma e repositórios com tenant obrigatório serão a fronteira contra SQL injection, IDOR e vazamento entre organizações.
- Refresh tokens, senhas, cookies, segredos e conteúdo sensível nunca entram em responses ou logs de auditoria.
- Operações de escrita críticas receberão auditoria com ator, organização, entidade, IP, user agent, antes/depois sanitizados e correlação de requisição.
- Redis será usado para rate limiting distribuído, revogação, idempotência e filas; não como fonte definitiva de dados.

## Antes de produção

Defina origens CORS reais, gere segredos independentes com no mínimo 32 caracteres, force HTTPS, configure backup/retention, aplique migrações, limite acesso de rede a banco/Redis e habilite monitoramento de erros e métricas.
