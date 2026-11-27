# Etapa 1 — Autenticação, tenant e papéis

Sanctum emite um token Bearer. O frontend guarda o token e o slug da agência em cookies do próprio domínio para o `proxy.ts` proteger as rotas.

Senha de todas as contas semeadas: `password`.

## Contratos

### `POST /api/v1/auth/register`

Cria a agência e o primeiro `agency_admin`.

```json
{
  "agency_name": "North Studio",
  "agency_slug": "north-studio",
  "name": "Ana Costa",
  "email": "ana@northstudio.test",
  "password": "password",
  "password_confirmation": "password"
}
```

Resposta `201`:

```json
{
  "token": "1|plain-token",
  "tenant": { "id": 3, "name": "North Studio", "slug": "north-studio" },
  "user": {
    "id": 10,
    "name": "Ana Costa",
    "email": "ana@northstudio.test",
    "role": "agency_admin",
    "workspace_id": null
  }
}
```

Slug duplicado ou e-mail duplicado responde `422`.

### `POST /api/v1/auth/login`

```json
{ "email": "jordan@agency-alpha.test", "password": "password" }
```

Resposta `200` no mesmo formato do cadastro. Credencial inválida responde `422`.

### `POST /api/v1/auth/logout`

Header `Authorization: Bearer {token}`. Revoga o token atual e responde `204`.

### `GET /api/v1/auth/me`

Headers `Authorization` e `X-Tenant-ID` (id numérico da agência). Resposta `200` com `user`, `tenant` e `agencies`. Sem token, `401`. Header de uma agência sem vínculo, `403`.

`POST /api/v1/auth/switch-agency` recebe `{ "tenant_id": 2 }` com os mesmos headers da agência atual. Sem vínculo, `422`. O token não muda.

### `GET /api/v1/users` e `POST /api/v1/users`

Mesmos headers. Só `agency_admin`. A listagem devolve apenas usuários da agência do contexto. O corpo de criação:

```json
{
  "name": "Mia Lee",
  "email": "mia@agency-alpha.test",
  "password": "password",
  "role": "designer",
  "workspace_id": null
}
```

`role: "client"` exige `workspace_id` de um workspace dessa agência. Designer, redator e cliente recebem `403` na listagem.

## Contas do seeder

Agência **Agency Alpha**, slug `agency-alpha`:

| Nome | E-mail | Papel | Workspace |
| --- | --- | --- | --- |
| Jordan Miller | jordan@agency-alpha.test | agency_admin | — |
| Sarah Reyes | sarah@agency-alpha.test | designer | — |
| John Park | john@agency-alpha.test | copywriter | — |
| Olivia Chen | olivia@aster.test | client | Aster & Co. |

Agência **Horizon Studio**, slug `horizon-studio`. As marcas abaixo existem só nessa agência:

| Nome | E-mail | Papel | Workspace |
| --- | --- | --- | --- |
| Helena Rocha | helena@horizon-studio.test | agency_admin | — |
| Rafael Mendes | rafael@horizon-studio.test | designer | — |
| Clara Nunes | clara@horizon-studio.test | copywriter | — |
| Beatriz Almeida | beatriz@lumen.test | client | Lumen Atelier |
| Diego Santos | diego@vela.test | client | Vela Market |
| Inês Carvalho | ines@porto.test | client | Porto & Pine |

Maya Costa (`maya@studios.test`, designer) pertence às duas agências. O login abre Agency Alpha. No menu ela troca para Horizon Studio.

Agência **Newton**, slug `newton`:

| Nome | E-mail | Papel | Workspace |
| --- | --- | --- | --- |
| Thais | thais@newton.ag | agency_admin | — |
| Ellen | ellen.medeiros@newton.ag | agency_admin | — |
| Sarah | sarah.poleto@eobox.com.br | agency_admin | — |
| Caique | caique.lemos@newton.ag | designer | — |
| Juliana | juliana.brito@newton.ag | copywriter | — |
| Paulo | paulo@hernandez.com | client | Hernandez |
| Pedro | pedro@febrasgo.com | client | Febrasgo |
| João | joao@momentum.com | client | Momentum |

O endereço pedido para o João era `joao@momentum`. O login exige um e-mail com domínio, então a conta semeada é `joao@momentum.com`.

Workspaces semeados em Agency Alpha: Aster & Co., Northstar Labs, Kora House. Em Horizon Studio: Lumen Atelier, Vela Market, Porto & Pine. Em Newton: Hernandez, Febrasgo, Momentum. As peças entregues nascem com título e legenda publicados. O blog leva só o título, junto com a capa e o artigo.
