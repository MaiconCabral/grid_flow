# Etapa 5 — Approval Center

`/{slug}/approval` lista as tarefas que a pessoa pode ver. O clique abre `/{slug}/approval/{id}`, no layout da peça. A interface segue em inglês.

## Lista

Marca, título, canal e formato, status, responsável e data. O admin vê a agência inteira. Designer e redator veem só as próprias tarefas. O cliente vê a marca dele. O quadro usa o mesmo corte.

## Peça

O preview mostra a versão aberta. As setas e os botões v1, v2 trocam a versão. Numa imagem, o clique calcula a posição em porcentagem e deixa o comentário preso àquele pino. Comments traz a conversa, a resposta, resolver e, para a equipe, a nota interna. Details mostra marca, formato, data, responsável e status.

Em In Production, a equipe envia a próxima versão: imagem, PDF, DOC ou link do YouTube. **Request revisions** e **Approve piece** aparecem só para o cliente da marca. Share permanece visual. Download abre o arquivo da versão aberta.

## Arquivos

- `src/components/approval/approval-list.tsx` — lista
- `src/components/approval/approval-view.tsx` — peça, versões, pinos e decisão
- `src/app/(platform)/[tenantSlug]/approval/[activityId]/page.tsx` — rota da peça
- `src/lib/activities.ts` — tipos da versão, do pino e do comentário
