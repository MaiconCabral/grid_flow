# Etapa 6 — Dashboard

`/{slug}/dashboard` deixa o mock e lê `GET /dashboard`. A interface segue em inglês. O seletor “Viewing as” continua visual e não muda os números.

## Por papel

O admin vê em produção, pendentes, aprovadas e agendadas da agência, o funil, a semana, o histórico e as marcas com trabalho aberto. **New activity** abre o quadro. Export permanece visual.

Designer e redator veem as próprias tarefas: em produção, aguardando o cliente, com entrega nesta semana e atrasadas. As marcas são só as das tarefas deles.

O cliente vê o que aguarda a revisão dele, o que está em produção, o aprovado e o agendado. A ação abre a peça em `/{slug}/approval/{id}`.

## Menu

Team & Clients e Settings, no menu e no usuário, só aparecem para o admin. Os outros papéis que abrem a URL veem que a página não está disponível. Os selos de Workspace e Approval Center contam as tarefas visíveis e as pendentes.

## Arquivos

- `src/components/dashboard/dashboard-view.tsx` — painel
- `src/lib/dashboard.ts` — formato da resposta
- `src/components/shell/sidebar.tsx` — menu e selos
