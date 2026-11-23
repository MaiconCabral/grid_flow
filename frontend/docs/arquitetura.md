# Arquitetura de interface

## Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (platform)/
│   │   └── [tenantSlug]/
│   │       ├── dashboard/page.tsx
│   │       ├── workspace/page.tsx
│   │       ├── workspace/[activityId]/page.tsx
│   │       ├── approval/page.tsx
│   │       ├── approval/[activityId]/page.tsx
│   │       ├── team/page.tsx
│   │       └── settings/page.tsx
│   ├── layout.tsx
│   └── globals.css
├── features/          # entra nas etapas 2 a 4 (kanban, approval, realtime)
├── components/
├── lib/
│   └── api-client.ts
└── proxy.ts
```

A gestão de membros e marcas fica em `/{slug}/team`, no componente `src/components/team/team-view.tsx`. Sucesso e erro dessa tela, do login e do cadastro passam por `src/lib/alerts.ts`. O convite por token (`invite/[token]`) continua para a etapa de e-mail transacional.

`features/` e os clientes de TanStack Query, Zustand, Echo e upload direto também ficam para as próximas etapas. O login desta etapa chama a API com `fetch`.

## Tema

As cores de fundo e o destaque vêm da agência, gravados em `tenants`. A chave `postgrid-theme` no `localStorage` só reaplica a última resposta antes da API responder. O lightbox, o SweetAlert e o restante da interface leem essas variáveis.

O quadro e a ficha da tarefa ficam em `src/components/workspace/`. O detalhe está em [etapas/04-workspace.md](etapas/04-workspace.md).

A lista e a peça ficam em `src/components/approval/`. O detalhe está em [etapas/05-aprovacao.md](etapas/05-aprovacao.md).

O painel fica em `src/components/dashboard/`. O detalhe está em [etapas/06-dashboard.md](etapas/06-dashboard.md).

## Etapas futuras na interface

- **Upload em nuvem e tempo real.** URL pré-assinada e escuta do canal do workspace. O anexo atual vai para o disco local da API.
