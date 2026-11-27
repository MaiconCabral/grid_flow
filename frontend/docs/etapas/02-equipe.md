# Etapa 2 — Team & Clients

A tela `/{slug}/team` gerencia a equipe interna e as marcas da agência logada. Os dados vêm de `GET /users` e `GET /workspaces`. A interface continua em inglês. Viewing as está oculto por `showVisualPlaceholders` e não muda o papel real.

O convite em `invite/[token]` e o e-mail transacional ficam para uma etapa futura. O admin define a senha no cadastro. O atalho Invite teammates no menu do usuário está oculto pela mesma flag. Team & Clients permanece no menu Manage.

## Quem acessa

Só `agency_admin` vê as listas e os formulários. Designer, redator e cliente veem a mensagem de que apenas o Agency Admin gerencia a equipe. Nesse caso a página não chama a API de usuários nem de marcas.

## Equipe

O botão Add teammate abre um lightbox com nome, e-mail, senha e papel (`agency_admin`, `designer`, `copywriter`). Editar reabre o mesmo lightbox preenchido. Na edição a senha é opcional e o rótulo passa a ser New password.

## Clientes

A seção tem um único botão, Add clients. O lightbox traz as abas Brands e Users.

- Brands grava o nome da marca (`POST` ou `PATCH /workspaces`).
- Users grava o cliente: nome, e-mail, senha e a marca (`POST` ou `PATCH /users` com `role: client`).

Trocar de aba não apaga o que já foi digitado na outra. Editar uma marca abre a aba Brands preenchida. Editar um cliente abre a aba Users com nome, e-mail e marca preenchidos. A senha só é obrigatória na criação.

## Remoção

Edit e Remove ficam no cartão. Remove pede Confirm na própria linha. A exclusão de uma marca que ainda tem cliente, ou do último admin, volta como erro da API.

## Alertas

Sucesso e erro usam o SweetAlert (`src/lib/alerts.ts`).

- Sucesso fecha sozinho. Exemplos: Brand created, Client updated, Teammate created, Brand removed, User removed.
- Erro permanece até o OK. A mensagem é a da API, como e-mail já usado ou marca com cliente.
- Login e cadastro usam o mesmo alerta de erro.

O fundo, o texto e o botão acompanham o tema da agência. As cores vêm das variáveis do layout.

## Tema do lightbox

O formulário usa as mesmas variáveis do layout (`card`, `raised`, `foreground`). O `color-scheme` do diálogo segue a escolha do usuário, então campos e o seletor nativo acompanham o claro e o escuro, inclusive se o tema mudar com o lightbox aberto.

## Arquivos

- `src/app/(platform)/[tenantSlug]/team/page.tsx` — rota da tela
- `src/components/team/team-view.tsx` — listas, lightbox e abas
- `src/lib/alerts.ts` — sucesso e erro
- `src/app/globals.css` — aparência do SweetAlert
