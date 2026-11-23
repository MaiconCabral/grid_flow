# Etapa 3 — Configurações da agência

Nome, tema, cores e plano ficam na linha da agência em `tenants`. Cada agência tem o próprio registro. O `localStorage` só evita o flash antes da resposta; a leitura seguinte do banco substitui essa cópia.

## Colunas

| Coluna | Padrão | Uso |
| --- | --- | --- |
| `theme` | `dark` | `dark` ou `light` |
| `light_background` | `#f0f1ed` | Fundo do tema claro, entre as amostras permitidas |
| `dark_background` | `#111313` | Fundo do tema escuro, entre as amostras permitidas |
| `accent` | `#bbff52` | Cor de destaque, entre as amostras permitidas |
| `plan` | `studio` | Plano atual. Esta etapa não troca o plano |

`name` já existia. O slug continua fora do `PATCH`, porque entra na URL e no cookie.

## Rotas

As duas exigem `Authorization: Bearer` e `X-Tenant-ID`.

`GET /api/v1/settings` devolve nome, slug, tema, as três cores, `plan` e a lista `plans`. Qualquer papel da agência pode ler.

`PATCH /api/v1/settings` aceita só o que vier: `name`, `theme`, `light_background`, `dark_background`, `accent`. Só o `agency_admin` grava. Outro papel recebe `403`. Cor fora da lista recebe `422`.

`GET /api/v1/auth/me` passa a incluir tema, cores e plano dentro de `tenant`, para o shell aplicar ao entrar.

## Código

| Peça | Função |
| --- | --- |
| `SettingsController` | Lê e grava a agência da requisição |
| `UpdateTenantSettings` | Preenche a linha do tenant |
| `TenantPolicy` | Leitura para o membro da agência; escrita só para o admin dela |
| `AgencyPalette` | Lista fechada de cores |
| `AgencyPlans` | Textos dos planos Starter, Studio e Agency |
| `tests/Feature/SettingsTest.php` | Gravação, papel sem permissão, cor inválida e isolamento |

Não há cobrança. Stripe continua fora desta etapa.
