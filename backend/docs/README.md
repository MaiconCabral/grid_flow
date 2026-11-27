# GridFlow — guia do backend

API da plataforma de gestão de social media. A agência é o cliente da ferramenta. As marcas que ela atende ficam em workspaces.

A stack deste repositório é Laravel 12 e PHP 8.2, com SQLite no ambiente local. O esquema usa tipos compatíveis com MySQL. Sanctum emite tokens Bearer.

## Etapas

| Etapa | Guia | Estado |
| --- | --- | --- |
| 1. Autenticação, tenant e papéis | [etapas/01-autenticacao.md](etapas/01-autenticacao.md) | Implementada |
| 2. Equipe e clientes | [etapas/02-equipe.md](etapas/02-equipe.md) | Implementada |
| 3. Configurações da agência | [etapas/03-configuracoes.md](etapas/03-configuracoes.md) | Implementada |
| 4. Workspace | [etapas/04-workspace.md](etapas/04-workspace.md) | Implementada |
| 5. Approval Center | [etapas/05-aprovacao.md](etapas/05-aprovacao.md) | Implementada |
| 6. Dashboard | [etapas/06-dashboard.md](etapas/06-dashboard.md) | Implementada |
| 7. Upload em nuvem e tempo real | [../../docs/pendencias.md](../../docs/pendencias.md) | Não iniciada |

A visão geral do isolamento e dos papéis está em [arquitetura.md](arquitetura.md). A etapa em aberto e os controles ocultos estão em [pendencias.md](../../docs/pendencias.md).

## O que cada etapa futura entrega

- **Upload em nuvem e tempo real.** URL pré-assinada, miniatura em fila, e-mail transacional e canal privado por workspace. O anexo atual fica no disco local. Cache dos indicadores fica para essa etapa. Redis, Reverb, Horizon e OpenAPI não entram antes dela.
