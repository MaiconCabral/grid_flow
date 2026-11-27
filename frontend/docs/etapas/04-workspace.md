# Etapa 4 — Workspace

O quadro em `/{slug}/workspace` lê a API. Board, List, Calendar, a busca e o filtro por marca continuam. A interface segue em inglês.

## Quadro

New activity abre o lightbox para o admin: marca, título, briefing, um PDF ou DOC opcional, canal, formato, responsável e data. O título e o briefing continuam internos. Debaixo do formato, um aviso diz o que a entrega vai pedir: título e legenda no post, story, vídeo e carrossel; capa e artigo no blog. A tarefa nasce em To Do. Designer, redator e cliente não veem esse botão. O card sem foto usa o degradê gravado na criação.

O admin arrasta o card entre To Do, In Production, Pending Approval e Scheduled. A coluna Approved não aceita o card. O selo mostra canal e formato, por exemplo Instagram Carousel. Os quatro indicadores do topo contam as tarefas visíveis. Export está oculto por `showVisualPlaceholders`.

O cliente só vê a própria marca no filtro. A equipe vê as marcas da agência.

## Ficha

O card, a linha da lista e o item do calendário abrem `/{slug}/workspace/{id}`. A página mostra briefing, tipo, responsável, status, arquivos e a linha do tempo. Cada evento traz quem fez e quando.

Em In Production, a ficha pede a entrega do formato. Post, story, vídeo e carrossel levam título, legenda e o arquivo. O blog leva título, capa e um PDF ou Word. Save copy grava o texto da versão atual sem um upload novo. A equipe troca o briefing em qualquer status. Em Pending Approval, o cliente da marca aprova ou pede ajuste com uma nota. Versões, slides e pinos ficam na Approval Center, em [05-aprovacao.md](05-aprovacao.md). O upload em nuvem fica para a etapa seguinte.

## Arquivos

- `src/components/workspace/workspace-view.tsx` — quadro, lista, calendário e o lightbox
- `src/components/workspace/activity-view.tsx` — ficha, entrega e histórico
- `src/lib/activities.ts` — tipos, rótulos e datas
- `src/app/(platform)/[tenantSlug]/workspace/[activityId]/page.tsx` — rota da ficha
