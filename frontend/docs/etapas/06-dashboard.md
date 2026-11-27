# Etapa 6 — Dashboard

`/{slug}/dashboard` deixa o mock e lê `GET /dashboard`. A interface segue em inglês. Viewing as está oculto por `showVisualPlaceholders` e não muda os números.

## Por papel

O admin vê em produção, pendentes, aprovadas e agendadas da agência, o funil, a semana, o histórico e as marcas com trabalho aberto. **New activity** abre o quadro. Export report está oculto pela mesma flag.

Designer e redator veem as próprias tarefas: em produção, aguardando o cliente, com entrega nesta semana e atrasadas. As marcas são só as das tarefas deles.

O cliente não usa este painel. A home dele é a grade de peças em [07-visao-cliente.md](07-visao-cliente.md).

## Menu

Team & Clients e Settings só aparecem para o admin. Storage e Help center estão ocultos pela flag; o sino de notificações continua, com os três avisos de exemplo. No menu do usuário ficam Account preferences e Sign out. Invite teammates está oculto. Os outros papéis que abrem a URL veem que a página não está disponível. O cliente vê só Pieces. Os selos de Workspace e Approval Center contam as tarefas visíveis e as pendentes para a equipe. O cartão da agência abre a lista de agências só quando a pessoa pertence a duas ou mais. A troca grava o cookie e recarrega o painel da agência escolhida. Quem tem uma agência vê só o nome.

## Arquivos

- `src/components/dashboard/dashboard-view.tsx` — painel
- `src/lib/dashboard.ts` — formato da resposta
- `src/components/shell/sidebar.tsx` — menu e selos
