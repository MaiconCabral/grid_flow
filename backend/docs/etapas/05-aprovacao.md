# Etapa 5 — Approval Center

A lista e a peça deixam o mock. A interface continua em inglês. O arquivo segue no disco `public`; o envio para a nuvem fica para a etapa seguinte.

## Quem vê a tarefa

O admin vê todas as tarefas da agência, inclusive as sem responsável. Designer e redator veem só as tarefas em que são o responsável, no quadro e na Approval Center. Abrir a tarefa de um colega pela URL responde 403. O cliente continua vendo só a marca dele, e só em Pending Approval, Approved e Scheduled. To Do e In Production respondem 403.

## Versões

Cada entrega vira uma versão da mesma peça, em `activity_versions`: número, autor, tipo, nome, título, legenda, caminho ou URL e `is_current`. A entrega que já existia em `activity_assets` vira versão, e a última fica atual.

Subir a entrega, na ficha do quadro ou na peça, cria a próxima versão e tira o atual da anterior. Post, story, vídeo e carrossel exigem título e legenda. O blog exige título, capa e um PDF, DOC ou DOCX. Só a equipe envia. Post, story, carrossel e blog só em In Production; o vídeo aceita o link em qualquer status. `PATCH /api/v1/activities/{activity}/versions/{version}` atualiza o texto da versão atual sem um arquivo novo. A capa do card usa a imagem da versão atual, e no blog usa o arquivo com papel `cover`.

## Pinos e comentários

`activity_annotations` guarda a versão, o autor e `x`/`y` em porcentagem. `activity_comments` guarda o texto, o autor, a resposta, o pino, o lado (`scope` `asset` ou `copy`), `resolved_at` e `is_internal`. Comentário antigo fica em `asset`. A resposta herda o lado do comentário pai.

A peça separa Creative e Copy. O comentário novo usa o lado da aba aberta, e a conversa da aba mostra só aquele lado. Um clique na imagem, ou na capa do blog, grava o pino e o primeiro comentário no lado do criativo. Comentário sem pino, resposta e resolver também existem. Nota interna só a equipe escreve e só a equipe recebe. O artigo, o PDF solto e o YouTube não aceitam pino. Os pinos de uma versão não aparecem em outra.

## Decisão

**Request revisions** e **Approve piece** aparecem só para o cliente da marca e usam as rotas que já existiam. Fora de Pending Approval a API recusa. Share está oculto por `showVisualPlaceholders` no front. Download abre o arquivo da versão aberta.

Rotas novas, sob `auth:sanctum` e `tenant`:

- `POST /api/v1/activities/{activity}/comments`
- `PATCH /api/v1/activities/{activity}/comments/{comment}`
- `POST /api/v1/activities/{activity}/versions/{version}/annotations`
