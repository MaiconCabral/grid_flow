# Arquitetura

## Tenant e workspace

O tenant é a agência que contrata o GridFlow, por exemplo Agency Alpha. Todo dado de domínio carrega `tenant_id`.

O workspace é a marca atendida por essa agência, por exemplo Aster & Co. Cada marca pertence a uma única agência. O Cliente Final entra com login próprio e fica ligado a uma marca dessa agência; a mesma pessoa não é reutilizada em outra agência. As tarefas dessa marca ficam em `activities`. O detalhe está em [etapas/04-workspace.md](etapas/04-workspace.md).

Não usamos banco por agência nem `stancl/tenancy`. O isolamento é um Global Scope do Eloquent.

## Global Scope

`TenantScope` filtra `tenant_id` com o valor guardado em `TenantContext`. Sem contexto, a query devolve zero linhas. Login e cadastro chamam `withoutGlobalScopes()` porque ainda não há tenant ativo.

O middleware `ResolveTenant` lê o header `X-Tenant-ID`. O valor tem de ser o id da agência do usuário autenticado. Outro id responde `403`.

## Papéis

| Valor | Quem é | Nesta etapa |
| --- | --- | --- |
| `agency_admin` | Admin da Agência | Cadastra a agência e faz o CRUD de usuários e marcas dela |
| `copywriter` | Redator | Lê o próprio perfil |
| `designer` | Designer | Lê o próprio perfil |
| `client` | Cliente Final | Lê o próprio perfil e fica ligado a um workspace |

Um usuário pertence a uma agência. O seletor visual “Viewing as” da interface não troca o papel real. O CRUD de usuários e marcas fica nas policies: só o admin da mesma agência segue. Nome, tema, cores e plano também ficam nessa linha de `tenants`. O admin cria e move tarefas e vê todas elas. Designer e redator veem e entregam só as tarefas em que são o responsável. O cliente vê a própria marca, comenta com pinos e aprova. O detalhe está em [etapas/02-equipe.md](etapas/02-equipe.md), [etapas/03-configuracoes.md](etapas/03-configuracoes.md), [etapas/04-workspace.md](etapas/04-workspace.md) e [etapas/05-aprovacao.md](etapas/05-aprovacao.md).

## Fora desta etapa

Upload em nuvem, filas, Reverb e cache dos indicadores. O anexo atual fica no disco `public`.
