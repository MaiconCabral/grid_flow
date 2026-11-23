# Etapa 4 — Workspace

O quadro em `/{slug}/workspace` lê a API. Board, List, Calendar, a busca e o filtro por marca continuam. A interface segue em inglês.

## Quadro

New activity abre o lightbox para o admin: marca, título, briefing, canal, formato, responsável e data. A tarefa nasce em To Do. Designer, redator e cliente não veem esse botão.

O admin arrasta o card entre To Do, In Production, Pending Approval e Scheduled. A coluna Approved não aceita o card. O selo mostra canal e formato, por exemplo Instagram Carousel. Os quatro indicadores do topo contam as tarefas visíveis. Export permanece visual.

O cliente só vê a própria marca no filtro. A equipe vê as marcas da agência.

## Ficha

O card, a linha da lista e o item do calendário abrem `/{slug}/workspace/{id}`. A página mostra briefing, tipo, responsável, status, arquivos e a linha do tempo. Cada evento traz quem fez e quando.

Em In Production, a equipe anexa imagem, PDF, DOC ou link do YouTube. Em Pending Approval, o cliente da marca aprova ou pede ajuste com uma nota. Versões e pinos ficam na Approval Center, em [05-aprovacao.md](05-aprovacao.md). O upload em nuvem fica para a etapa seguinte.

## Arquivos

- `src/components/workspace/workspace-view.tsx` — quadro, lista, calendário e o lightbox
- `src/components/workspace/activity-view.tsx` — ficha, entrega e histórico
- `src/lib/activities.ts` — tipos, rótulos e datas
- `src/app/(platform)/[tenantSlug]/workspace/[activityId]/page.tsx` — rota da ficha
