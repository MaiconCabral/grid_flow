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
│   │       ├── approval/page.tsx
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

Tokens já aplicados: fundo `#111313`, lima `#bbff52`, roxo `#9b35aa`. O tema claro e o escuro continuam no `localStorage`, chave `morrow-theme`. O lightbox de Team & Clients e o SweetAlert usam as variáveis desse tema.

## Etapas futuras na interface

- **Kanban.** Trocar o quadro mock por `GET /api/v1/workspaces/{workspaceId}/board`, com atualização otimista quando a API existir.
- **Aprovação.** Pinos em porcentagem da área da peça e os botões de aprovar ou pedir ajuste.
- **Upload e tempo real.** URL pré-assinada e escuta do canal do workspace.
