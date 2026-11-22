# Arquitetura

## Tenant e workspace

O tenant é a agência que contrata o GridFlow, por exemplo Agency Alpha. Todo dado de domínio carrega `tenant_id`.

O workspace é a marca atendida por essa agência, por exemplo Aster & Co. Cada marca pertence a uma única agência. O Cliente Final entra com login próprio e fica ligado a uma marca dessa agência; a mesma pessoa não é reutilizada em outra agência. Nesta primeira etapa a tabela só existe para esse vínculo. O quadro Kanban vem depois.

Não usamos banco por agência nem `stancl/tenancy`. O isolamento é um Global Scope do Eloquent.

## Global Scope

`TenantScope` filtra `tenant_id` com o valor guardado em `TenantContext`. Sem contexto, a query devolve zero linhas. Login e cadastro chamam `withoutGlobalScopes()` porque ainda não há tenant ativo.

O middleware `ResolveTenant` lê o header `X-Tenant-ID`. O valor tem de ser o id da agência do usuário autenticado. Outro id responde `403`.

## Papéis

| Valor | Quem é | Nesta etapa |
| --- | --- | --- |
| `agency_admin` | Admin da Agência | Cadastra a agência, lista e cria usuários dela |
| `copywriter` | Redator | Lê o próprio perfil |
| `designer` | Designer | Lê o próprio perfil |
| `client` | Cliente Final | Lê o próprio perfil e fica ligado a um workspace |

Um usuário pertence a uma agência. O seletor visual “Viewing as” da interface não troca o papel real.

## Fora desta etapa

Quadro, versões de peça, comentário interno, upload direto, filas, Reverb e cache dos indicadores. As rotas dessas áreas não existem ainda.
