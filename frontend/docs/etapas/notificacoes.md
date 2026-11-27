# Notificações in-app

O sino do topo lê `GET /api/v1/notifications`. Vale no painel, no quadro e na grade do cliente. A frase do sino segue o idioma da agência: a tela monta o texto pelo `type`, pelo título e por `actor_name`. O `body` gravado fica em inglês. Cada função nova leva um comentário de uma linha, em inglês, dizendo só o que faz.

O ponto lima só aparece quando há aviso não lido. A lista mostra a frase traduzida e a idade. Vazio, em inglês: “No notifications yet.” O clique marca como lido, com `PATCH /api/v1/notifications/{id}/read`, e abre a tarefa.

A primeira busca só preenche o sino. A cada 60 segundos a tela busca de novo. Se entrou aviso novo, uma modal mostra o título, a frase e o botão de abrir a tarefa. Vários no mesmo minuto: a modal fica com o mais recente. Fechar não marca como lido.

O cliente segue para `/{slug}/approval/{id}`. A equipe segue para `/{slug}/workspace/{id}` na fila e na entrega, e para a peça de aprovação quando o cliente aprova ou pede ajuste. O `href` já vem pronto da API.

`applyNotification` é o único ponto que inclui um aviso na lista. Hoje o poll usa isso. O canal do Reverb, mais tarde, usa o mesmo ponto. Não há websocket nesta versão.

Quem recebe cada aviso, e o texto em inglês gravado na hora, está em [notificacoes.md](../../../backend/docs/etapas/notificacoes.md) do backend.

## Arquivos

- `src/lib/notifications.ts` — formato da resposta, inclusão na lista e idade do aviso
- `src/components/shell/use-notifications.ts` — busca, poll de 60 segundos, leitura e abertura da tarefa
- `src/components/shell/notification-alert.tsx` — modal com **Open task**
- `src/components/shell/topbar.tsx` — sino
- `src/components/shell/app-shell.tsx` — liga o poll ao topo
