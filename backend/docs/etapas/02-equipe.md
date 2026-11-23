# Etapa 2 — Equipe e clientes

O admin da agência gerencia as pessoas e as marcas da própria agência. Designer, redator e cliente recebem `403`. Um id de outra agência responde `404`.

O convite por token continua fora desta etapa. O admin define a senha no cadastro.

Todas as rotas exigem `Authorization: Bearer` e `X-Tenant-ID`.

## Usuários

`GET /api/v1/users` devolve `{ data: [...] }`. Cada item traz `id`, `name`, `email`, `role`, `workspace_id` e `workspace_name`.

`POST /api/v1/users` cria. `PATCH /api/v1/users/{id}` atualiza. Corpo:

```json
{
  "name": "Rafael Mendes",
  "email": "rafael@horizon-studio.test",
  "password": "password",
  "role": "designer",
  "workspace_id": null
}
```

No `PATCH`, `password` é opcional. `role: "client"` exige `workspace_id` de uma marca dessa agência. Os outros papéis gravam `workspace_id` nulo.

`DELETE /api/v1/users/{id}` responde `204`. O admin não remove a própria conta nem o último `agency_admin`. Trocar o papel do último admin responde `422`.

## Marcas

`GET /api/v1/workspaces` devolve `{ data: [...] }` com `id`, `name` e `clients` (`id`, `name`, `email`).

`POST /api/v1/workspaces` e `PATCH /api/v1/workspaces/{id}` recebem `{ "name": "Lumen Atelier" }`.

`DELETE /api/v1/workspaces/{id}` responde `204`. Se ainda houver um cliente ligado à marca, a resposta é `422`.

## Código

| Peça | Função |
| --- | --- |
| `UserController` | Lista, cria, atualiza e remove usuários |
| `WorkspaceController` | Lista, cria, renomeia e remove marcas, com os clientes de cada uma |
| `Actions/Users` | Cria e atualiza o usuário, exige marca para o cliente, impede apagar a si mesmo e o último admin |
| `Actions/Workspaces` | Cria e renomeia a marca e bloqueia a exclusão se ainda houver cliente |
| `UserPolicy` e `WorkspacePolicy` | Só o `agency_admin` da mesma agência |
| `tests/Feature/TeamTest.php` | Permissão, isolamento, cliente sem marca e último admin |

`ResolveTenant` roda antes do route-model binding. Sem isso, o escopo da agência ainda está vazio e um `PATCH` ou `DELETE` válido responde `404`.

As mensagens de validação saem em inglês. A tela mostra essas frases no SweetAlert.
