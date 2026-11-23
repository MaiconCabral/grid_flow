# Etapa 1 — Login, cadastro e sessão

## Cookies

Depois de `login` ou `register`, o browser grava três cookies no domínio do Next:

| Cookie | Conteúdo |
| --- | --- |
| `gridflow_token` | Token Bearer do Sanctum |
| `gridflow_tenant` | Slug da agência, usado na URL |
| `gridflow_tenant_id` | Id numérico enviado em `X-Tenant-ID` |

`src/lib/api-client.ts` lê esses cookies e envia `Authorization` e `X-Tenant-ID`. Logout chama `POST /api/v1/auth/logout` e apaga os cookies.

A base da API é `NEXT_PUBLIC_API_URL`, com padrão `http://localhost:8000`.

## Rotas

`src/proxy.ts` roda antes da renderização.

- Sem `gridflow_token`, qualquer rota do painel vai para `/login`. `/` também vai para `/login`.
- Com token, `/login` e `/register` vão para `/{slug}/dashboard`.
- Se o slug da URL não for o da sessão, o proxy troca pelo slug do cookie e mantém a seção (`dashboard`, `workspace`, `approval`, `team`, `settings`).

O painel mock continua em `/{slug}/dashboard`, `/{slug}/workspace` e `/{slug}/approval`. Os dados dessas telas ainda são locais. A sessão é que passa a ser real.

Contas de demonstração e o formato dos JSON estão em `backend/docs/etapas/01-autenticacao.md`.

Falha de login ou de cadastro abre o mesmo SweetAlert do restante da aplicação, no tema claro ou escuro ativo.
