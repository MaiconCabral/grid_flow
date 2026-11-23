# Etapa 4 — Workspace

O quadro deixa o mock e passa a ler as tarefas da agência. A interface continua em inglês. O arquivo vai para o disco `public` local, e o link só guarda a URL do YouTube. A peça com versões e pinos está em [05-aprovacao.md](05-aprovacao.md). O envio para a nuvem fica para a etapa seguinte.

## Tarefa

O admin cria a tarefa no lightbox New activity: marca, título, briefing, canal, formato, responsável e data. O responsável é designer, redator ou admin. A tarefa nasce em To Do.

Canais: Instagram, LinkedIn, Facebook, YouTube e TikTok. Formatos: Post, Carousel, Story, Video e Text. O card mostra os dois no selo.

O admin arrasta o card entre To Do, In Production, Pending Approval e Scheduled. A API recusa o destino Approved. Designer e redator veem as tarefas da agência e não movem o card. O cliente vê só a marca dele. O filtro All clients usa as marcas reais. Os quatro números do topo contam tarefas de verdade. O botão Export continua só visual.

## Entrega e decisão

Em In Production, designer, redator ou admin anexa imagem, PDF, DOC ou um link do YouTube. Fora dessa coluna a API recusa o anexo.

Na ficha `/{slug}/workspace/{id}`, com a tarefa em Pending Approval, o cliente daquela marca vê Approve e Request changes. Approve grava Approved. Request changes volta para In Production e guarda a nota no histórico. Cliente de outra marca recebe 403. O admin não aprova.

O histórico guarda quem fez e quando: criação, troca de status, anexo, aprovação e pedido de ajuste.

## Tabelas e rotas

Tudo fica na agência, com `tenant_id` e o escopo atual.

- `activities` — marca, autor, responsável, título, briefing, canal, formato, status, data
- `activity_assets` — tipo, nome, caminho ou URL, autor
- `activity_events` — ator, tipo, status de origem e destino, nota

Rotas sob `auth:sanctum` e `tenant`:

- `GET` e `POST /api/v1/activities`
- `GET` e `PATCH /api/v1/activities/{activity}`
- `POST /api/v1/activities/{activity}/assets`
- `POST /api/v1/activities/{activity}/approve`
- `POST /api/v1/activities/{activity}/request-changes`

O seeder coloca tarefas em Agency Alpha e Horizon Studio. Para os arquivos aparecerem no browser, o disco público precisa do atalho `php artisan storage:link`. A URL devolvida é um caminho `/storage/...`; o front junta com o endereço da API.
