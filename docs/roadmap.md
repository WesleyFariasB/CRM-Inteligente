# Plano de execução

1. **Arquitetura e configuração** — concluída.
2. **Banco e autenticação** — concluída: migration inicial, organizações, Argon2id, JWT, refresh rotativo, revogação e recuperação de senha.
3. **Papéis e permissões** — concluída: RBAC, guards, permissões por organização, auditoria e teste de escopo.
4. **Estrutura visual** — concluída: shell responsivo, design system e estados de carregamento/erro.
5. **Leads e contatos** — concluída: CRUDs paginados de leads, empresas e contatos, busca e deduplicação por e-mail de lead.
6. **Pipeline e oportunidades** — concluída: pipeline padrão, Kanban drag-and-drop, histórico de etapas e valores.
7. **Tarefas e atividades** — concluída: tarefas, atividades e referências aos registros comerciais.
8. **Dashboard e relatórios** — concluída: métricas, funil, origem, agenda e relatórios por etapa/responsável.
9. **Automações e notificações** — concluída no núcleo: regras persistidas, execução idempotente, ações de tarefa/notificação e central de notificações.
10. **Hardening de produção** — concluída para o repositório: auditoria, testes Jest/Supertest/Cypress, CI, containers e documentação. A ativação pública ainda depende de segredos, provedor de e-mail, Redis/DB gerenciados e resolução do alerta upstream do Next descrito no README.
