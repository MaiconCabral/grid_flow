# Pendências

O que o escopo ainda não entrega. As etapas 1 a 7 estão feitas. O markup dos controles visuais continua no código.

## Próxima etapa, ainda não iniciada

Upload em nuvem e tempo real. No guia do front é a etapa 8; no guia do back é a etapa 7.

- URL pré-assinada. A entrega ainda grava no disco `public` da API.
- Miniatura em fila, depois do upload.
- E-mail transacional. O convite por token (`invite/[token]`) espera este e-mail. Hoje o admin define a senha no cadastro.
- Canal privado por pessoa, para o aviso chegar sem esperar o minuto. Os registros e o formato da API já existem; o front busca a cada 60 segundos. Reverb entra em cima dessa tabela, no canal `tenant.{id}.user.{id}`.
- Cache dos indicadores do painel. Cada abertura lê o banco. Redis fica para esta etapa.
- Horizon e OpenAPI. Os dois ficam de fora até aqui.

A coluna Scheduled e o texto “Ready to publish” não publicam na rede. Nenhuma etapa descreve enviar a peça para Instagram, LinkedIn, Facebook, YouTube ou TikTok.

## Já na tela, ainda só visual

Estes controles não fazem o que o rótulo promete. Ficam ocultos por `showVisualPlaceholders` em `frontend/src/lib/placeholders.ts`, hoje `false`. O markup permanece. O sino ficou de fora desta lista: ele lê os avisos reais.

| Controle | Onde | Estado |
| --- | --- | --- |
| Export | Quadro | Oculto |
| Export report | Painel do admin | Oculto |
| Share | Peça na Approval Center | Oculto |
| Viewing as | Topo | Oculto |
| Storage | Menu do admin | Oculto. Os números são fixos, não o disco. |
| Help center | Menu | Oculto |
| Plans | Settings | Oculto. Starter, Studio e Agency seguem no `GET /settings`. Ninguém troca de plano. |
| Invite teammates | Menu do usuário | Oculto. Team & Clients continua em Manage. |

Team & Clients, Settings, o tema, Account preferences e a troca de agência continuam.
