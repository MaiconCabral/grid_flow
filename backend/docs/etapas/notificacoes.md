# Notificações in-app

O sino deixa os avisos de exemplo e lê `GET /api/v1/notifications`. A interface segue em inglês. Cada função nova leva um comentário de uma linha, em inglês, dizendo só o que faz.

O registro fica na tabela `notifications`, com agência, destinatário, tarefa, ator, tipo, título da peça, texto, `read_at` e as datas. Apagar a tarefa apaga os avisos dela. Outra pessoa ou outra agência recebe 404.

## Quem recebe

O autor da ação não recebe o próprio aviso. `NotifyActivity` grava o texto na hora.

- Designer ou redator entrega uma versão, em `StoreActivityAsset`: todos os admins da agência. Entrega feita pelo admin não gera aviso. Texto: `{nome} added a delivery on {título}.`
- O admin move a tarefa para In Production, em `MoveActivity`: só o responsável. Sem responsável, ninguém. Texto: `{título} is in your queue.`
- O admin move para Pending Approval: os clientes daquela marca. Texto: `{título} is ready for your review.`
- O cliente aprova, em `ApproveActivity`: o responsável e os admins. Texto: `{nome} approved {título}.`
- O cliente pede ajuste, em `RequestActivityChanges`: o responsável e os admins. Texto: `{nome} requested revisions on {título}.` Esse caminho não gera um segundo aviso de fila.

Os tipos gravados são `asset_added`, `queued`, `pending_review`, `approved` e `revision_requested`.

## Contrato

`GET /api/v1/notifications` devolve as 20 mais recentes e a contagem de não lidas. Cada item traz `id`, `type`, `activity_id`, `title`, `body`, `actor_name`, `href`, `read_at` e `created_at`. O `body` continua em inglês, gravado na hora. A tela monta a frase pelo `type`, pelo título e por `actor_name`, no idioma da agência.

O `href` já aponta para a tela daquele papel. O cliente abre `/{slug}/approval/{id}`. A equipe abre `/{slug}/workspace/{id}` na fila e na entrega, e `/{slug}/approval/{id}` quando o cliente aprova ou pede ajuste.

`PATCH /api/v1/notifications/{id}/read` marca como lido.

O front busca a lista ao abrir e de novo a cada minuto. A primeira carga só enche o sino. Um aviso que chega no minuto seguinte abre uma modal com **Open task**. Fechar a modal não marca como lido.

Esse formato é o que um canal privado `tenant.{id}.user.{id}` vai empurrar quando o Reverb entrar. Nesta versão não há broadcast, Echo nem fila. O único ponto que inclui um aviso na lista do front é `applyNotification`.

## Arquivos

- `app/Actions/Notifications/NotifyActivity.php` — escolhe os destinatários e grava o aviso
- `app/Models/UserNotification.php` — o registro e o `href` por papel
- `app/Enums/NotificationType.php` — os cinco tipos
- `app/Http/Controllers/Api/NotificationController.php` — lista e marca como lido
- `database/migrations/2026_11_27_120000_create_notifications_table.php` — a tabela
- `tests/Feature/NotificationTest.php` — destinatário, isolamento e exclusão
