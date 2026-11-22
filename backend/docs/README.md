# GridFlow — guia do backend

API da plataforma de gestão de social media. A agência é o cliente da ferramenta. As marcas que ela atende ficam em workspaces.

A stack deste repositório é Laravel 12 e PHP 8.2, com SQLite no ambiente local. O esquema usa tipos compatíveis com MySQL. Sanctum emite tokens Bearer.

## Etapas

| Etapa | Guia | Estado |
| --- | --- | --- |
| 1. Autenticação, tenant e papéis | [etapas/01-autenticacao.md](etapas/01-autenticacao.md) | Implementada |
| 2. Kanban | — | Não iniciada |
| 3. Aprovação e anotações | — | Não iniciada |
| 4. Upload, filas e tempo real | — | Não iniciada |

A visão geral do isolamento e dos papéis está em [arquitetura.md](arquitetura.md).

## O que cada etapa futura entrega

- **Kanban.** Workspaces com colunas, cards, checklist, tags e ordem para arrastar. `GET /api/v1/workspaces/{workspaceId}/board`.
- **Aprovação.** Versões de mídia, pinos em porcentagem e a decisão de aprovar ou pedir ajuste, movendo o card de coluna.
- **Upload e tempo real.** URL pré-assinada, miniatura em fila, e-mail transacional e canal privado por workspace. Cache dos indicadores fica para essa etapa. Redis, Reverb, Horizon e OpenAPI não entram antes dela.
