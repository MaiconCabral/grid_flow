# Etapa 4 — Workspace

O quadro deixa o mock e passa a ler as tarefas da agência. A interface continua em inglês. O arquivo vai para o disco `public` local, e o link só guarda a URL do YouTube. A peça com versões e pinos está em [05-aprovacao.md](05-aprovacao.md). O envio para a nuvem fica para a etapa seguinte.

## Tarefa

O admin cria a tarefa no lightbox New activity: marca, título, briefing, canal, formato, responsável e data. O briefing pode levar um PDF ou DOC opcional. O responsável é designer, redator ou admin. A tarefa nasce em To Do, com uma pasta `marca_hash` no disco público e um degradê de capa.

Canais: Instagram, LinkedIn, Facebook, YouTube e TikTok. Formatos: Post, Carousel, Story, Video e Text. O card mostra os dois no selo.

O admin arrasta o card entre To Do, In Production, Pending Approval e Scheduled. A API recusa o destino Approved. Designer e redator veem as tarefas da agência e não movem o card. O cliente vê só a marca dele. O filtro All clients usa as marcas reais. Os quatro números do topo contam tarefas de verdade. O botão Export continua só visual.

## Entrega e decisão

Em In Production, designer, redator ou admin anexa o que o formato pede: uma imagem no post e no story, várias imagens no carrossel, um PDF ou DOC no texto e uma URL do YouTube no vídeo. O PDF aparece na ficha, na central de aprovação e no lightbox do cliente; o DOCX vira texto na tela e o .doc abre em outra aba. Fora dessa coluna a API recusa a entrega. O arquivo de briefing pode ser trocado em qualquer status. Sem imagem, o card usa o degradê.

Na ficha `/{slug}/workspace/{id}`, com a tarefa em Pending Approval, o cliente daquela marca vê Approve e Request changes. Approve grava Approved. Request changes volta para In Production e guarda a nota no histórico. Cliente de outra marca recebe 403. O admin não aprova.

O histórico guarda quem fez e quando: criação, troca de status, anexo, aprovação e pedido de ajuste.

## Tabelas e rotas

Tudo fica na agência, com `tenant_id` e o escopo atual.

- `activities` — marca, autor, responsável, título, briefing, canal, formato, status, data, pasta, degradê e o arquivo de briefing
- `activity_version_files` — slides de uma versão, com posição, nome e caminho ou URL
- `activity_assets` — tipo, nome, caminho ou URL, autor
- `activity_events` — ator, tipo, status de origem e destino, nota

Rotas sob `auth:sanctum` e `tenant`:

- `GET` e `POST /api/v1/activities`
- `GET` e `PATCH /api/v1/activities/{activity}`
- `GET /api/v1/activities/{activity}/document`
- `POST /api/v1/activities/{activity}/assets`
- `POST /api/v1/activities/{activity}/briefing`
- `POST /api/v1/activities/{activity}/approve`
- `POST /api/v1/activities/{activity}/request-changes`

O seeder coloca tarefas em Agency Alpha e Horizon Studio. Para os arquivos aparecerem no browser, o disco público precisa do atalho `php artisan storage:link`. A URL devolvida é um caminho `/storage/...`; o front junta com o endereço da API.
