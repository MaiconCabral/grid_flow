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

A home do cliente fica em `src/components/client/`. O detalhe está em [etapas/07-visao-cliente.md](etapas/07-visao-cliente.md).

O sino e a modal ficam no shell. O detalhe está em [etapas/notificacoes.md](etapas/notificacoes.md).

## Controles ocultos

`src/lib/placeholders.ts` guarda `showVisualPlaceholders` em `false`. O markup continua no código; a tela não mostra esses controles enquanto a flag está desligada:

- Export no quadro e Export report no painel
- Share na peça de aprovação
- Viewing as no topo
- Storage e Help center no menu
- a aba Plans em Settings
- o atalho Invite teammates no menu do usuário

O sino de notificações permanece e lê os avisos reais. Team & Clients continua em Manage. A troca de agência, o tema e Account preferences também.

## Etapas futuras na interface

- **Upload em nuvem e tempo real.** URL pré-assinada e escuta do canal da pessoa. O aviso já existe e a tela busca a cada minuto. O anexo atual vai para o disco local da API.
