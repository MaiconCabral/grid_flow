# Etapa 5 — Approval Center

A lista e a peça deixam o mock. A interface continua em inglês. O arquivo segue no disco `public`; o envio para a nuvem fica para a etapa seguinte.

## Quem vê a tarefa

O admin vê todas as tarefas da agência, inclusive as sem responsável. Designer e redator veem só as tarefas em que são o responsável, no quadro e na Approval Center. Abrir a tarefa de um colega pela URL responde 403. O cliente continua vendo só a marca dele.

## Versões

Cada entrega vira uma versão da mesma peça, em `activity_versions`: número, autor, tipo, nome, caminho ou URL e `is_current`. A entrega que já existia em `activity_assets` vira versão, e a última fica atual.

Subir imagem, PDF, DOC ou link do YouTube, na ficha do quadro ou na peça, cria a próxima versão e tira o atual da anterior. Só a equipe envia, e só com a tarefa em In Production. A capa do card usa a imagem da versão atual.

## Pinos e comentários

`activity_annotations` guarda a versão, o autor e `x`/`y` em porcentagem. `activity_comments` guarda o texto, o autor, a resposta, o pino, `resolved_at` e `is_internal`.

Um clique na imagem grava o pino e o primeiro comentário. Comentário sem pino, resposta e resolver também existem. Nota interna só a equipe escreve e só a equipe recebe. PDF, DOC e YouTube não aceitam pino. Os pinos de uma versão não aparecem em outra.

## Decisão

**Request revisions** e **Approve piece** aparecem só para o cliente da marca e usam as rotas que já existiam. Fora de Pending Approval a API recusa. Share continua visual. Download abre o arquivo da versão aberta.

Rotas novas, sob `auth:sanctum` e `tenant`:

- `POST /api/v1/activities/{activity}/comments`
- `PATCH /api/v1/activities/{activity}/comments/{comment}`
- `POST /api/v1/activities/{activity}/versions/{version}/annotations`
