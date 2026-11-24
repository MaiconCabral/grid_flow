# Etapa 7 — Visão do cliente

Quem entra com papel `client` não vê o painel, o quadro nem a lista de aprovação. `/{slug}/dashboard` mostra as peças já enviadas da marca dele, lidas de `GET /activities`. To Do fica de fora. A interface segue em inglês.

## Grade

O mês vem de `due_on`, com setas para o anterior e o seguinte. Na primeira carga, se o mês atual não tem peça, abre o mês mais recente que tem. Feed reúne post, carrossel, vídeo e texto. Stories fica só com `format: story`. No Feed há um filtro de formato. Peça sem data aparece no grupo No date.

O card repete a capa e o chip de canal do quadro, com o badge de status no canto. Pending Approval é laranja, Approved é lima, In Production e Scheduled usam o laranja suave. O clique abre o lightbox.

## Lightbox

A peça entra numa moldura da rede: feed para Instagram, Facebook e LinkedIn, tela vertical para story e TikTok, player para YouTube. O carrossel mostra a capa com os pontos, porque a peça guarda uma imagem. A legenda é o briefing.

**Approve** chama `POST /activities/{id}/approve` e só fica ativo em Pending Approval. O badge atualiza na hora. **Add corrections** abre `/{slug}/approval/{id}`, onde o cliente marca pins e pede revisão. Escape, o fundo e o X fecham. As setas percorrem a lista filtrada.

## Menu

O cliente vê só Pieces. Workspace, Approval Center e o seletor Viewing as somem. Abrir `/{slug}/workspace`, a ficha da tarefa ou a lista `/{slug}/approval` volta para a home. A ficha de aprovação continua acessível. O link “Your pieces” dessa ficha volta para a grade. Admin, designer e redator seguem no painel de [06-dashboard.md](06-dashboard.md).

## Arquivos

- `src/components/client/client-home.tsx` — grade
- `src/components/client/piece-preview.tsx` — lightbox
- `src/components/client/home-switch.tsx` — escolhe a home pelo papel
- `src/components/client/staff-gate.tsx` — tira o cliente do quadro e da lista
- `src/components/shell/sidebar.tsx` — menu Pieces
- `src/components/shell/topbar.tsx` — sem Viewing as
