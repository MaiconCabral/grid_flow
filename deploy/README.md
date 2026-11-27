# Deploy do servidor de teste

O GridFlow roda numa VPS da Hostinger, atrás do Nginx Proxy Manager (NPM) que já atende outros sites. Esta instância é para testar. Os dados ficam: cada deploy só aplica as migrations novas.

Nada desta pasta muda o desenvolvimento local, que continua com XAMPP, `php artisan serve` e `npm run dev`.

## Como funciona

```text
Internet → NPM (80/443, gridflow.maiconcabral.com.br)
         → grid-router (nginx, rede grid_proxy, sem porta pública)
              /api, /storage, /up → api   (Laravel: PHP-FPM + nginx)
              o resto             → web   (Next.js)
         mysql 8.4, um banco (grid_flow)
```

Os nomes não seguem a pasta. A pasta é `/opt/gridflow`, a rede é `grid_proxy` e o container que o NPM alcança é `grid-router`.

A agência não usa subdomínio. Ela entra no caminho `/{slug}` e no header `X-Tenant-ID`. Um nome de host basta, sem certificado wildcard.

Não há fila nem agendador. O aviso in-app continua na busca de um minuto. Capas, artigos e briefings ficam no volume `storage`, no disco `public`, e saem em `/storage`.

| Arquivo | Para quê |
| --- | --- |
| `api.Dockerfile` | Imagem do Laravel |
| `web.Dockerfile` | Imagem do Next. `NEXT_PUBLIC_API_URL` entra na hora do build |
| `docker-compose.yml` | Serviços da VPS. As imagens vêm do GHCR |
| `docker-compose.local.yml` | Teste opcional dos contêineres na sua máquina, na porta 8088 |
| `nginx/router.conf` | Divide `/api`, `/storage` e `/up` para o Laravel e o resto para o Next |
| `.env.example` | Variáveis da VPS |

A rede `grid_proxy` é só deste projeto. O odontoApp continua na `odonto_proxy`. O NPM entra nas duas. A pasta na VPS é `/opt/gridflow`.

## Preparação da VPS (uma vez)

### 1. DNS

No painel do domínio, crie um registro A apontando para o IP da VPS. No servidor de teste o nome é `gridflow`, e o host público ficou `gridflow.maiconcabral.com.br`.

### 2. Certificado no NPM

Em **SSL Certificates → Add → Let's Encrypt**, peça o certificado de `gridflow.maiconcabral.com.br`. Um nome só, pelo desafio HTTP, chega. Não precisa de wildcard.

### 3. Docker e pasta da stack

```bash
sudo mkdir -p /opt/gridflow && sudo chown $USER /opt/gridflow
```

#### Rede dedicada entre o NPM e o GridFlow

```bash
NPM=$(docker ps --format '{{.Names}}' | grep -i -E 'proxy|npm' | head -1); echo "NPM: $NPM"
docker network create grid_proxy
docker network connect grid_proxy "$NPM"
```

O `docker network connect` continua valendo depois de reiniciar o NPM, mas se perde quando o container dele é recriado (numa atualização, por exemplo). Para deixar fixo, declare a rede no compose do próprio NPM, cuja pasta aparece com:

```bash
docker inspect "$NPM" --format '{{index .Config.Labels "com.docker.compose.project.working_dir"}}'
```

Nesse arquivo, acrescente `grid_proxy` às redes do serviço do NPM, sem remover as que ele já usa, e declare-a como `external: true`.

Copie para `/opt/gridflow` os arquivos `docker-compose.yml` e `nginx/`. Depois do primeiro deploy, o GitHub Actions passa a copiá-los sozinho.

### 4. `.env`

```bash
cp .env.example /opt/gridflow/.env   # e preencha
```

- O domínio real entra em `APP_URL`, `MAIL_FROM_ADDRESS` e `NEXT_PUBLIC_API_URL`. No teste: `https://gridflow.maiconcabral.com.br`.
- `GHCR_NAMESPACE` é o usuário ou a organização do GitHub, em minúsculas, o mesmo dono dos pacotes `grid-api` e `grid-web`.
- Preencha `MYSQL_ROOT_PASSWORD` e `DB_PASSWORD` só com letras e números. Uma senha que começa com `!` passa pelo shell do healthcheck, o MySQL fica unhealthy e o `up --wait` para. Sem `$`, aspas ou espaço.
- `APP_KEY` e as senhas ficam só neste `.env`. O `deploy/.env.example` permanece sem esses valores. O `backend/.env` do XAMPP não serve aqui.
- Gere a `APP_KEY` com:

  ```bash
  docker run --rm ghcr.io/<dono>/grid-api:latest php artisan key:generate --show
  ```

  Na primeira vez a imagem ainda não existe. Gere a chave localmente com `php artisan key:generate --show` dentro de `backend/` e cole o valor.

`NEXT_PUBLIC_API_URL` no `.env` da VPS não muda o site já publicado. O Next grava esse endereço na imagem, no build. O workflow usa a variable `DEPLOY_DOMAIN`.

### 5. Proxy host no NPM

- **Domain names:** `gridflow.maiconcabral.com.br`.
- **Forward:** `http`, host `grid-router`, porta `80`. O hostname é o container, não a pasta. `gridflow` nesse campo devolve 502.
- **SSL:** o certificado desse nome, com *Force SSL* e *HTTP/2*.

Nesta VPS o container do NPM se chama `nginx-proxy-manager`. Ele já entra na `grid_proxy`. A imagem dele não tem `wget`. O teste usa `curl`:

```bash
docker exec nginx-proxy-manager curl -fsS http://grid-router/up
```

A resposta certa é o HTML do Laravel com **Application up**.

### 6. Primeira subida

```bash
cd /opt/gridflow
echo <token> | docker login ghcr.io -u <usuario> --password-stdin   # só se os pacotes forem privados
docker compose pull
docker compose up -d --wait
docker compose exec api php artisan migrate --force
docker compose exec api php artisan storage:link
docker compose exec api php artisan db:seed --force
```

O seed roda uma vez, na mão. O workflow não o inclui. Sem ele o login responde `These credentials do not match our records`, porque as tabelas existem e os usuários não. A senha de todas as contas é `password`. A lista está em [01-autenticacao.md](../backend/docs/etapas/01-autenticacao.md). Para entrar: `https://gridflow.maiconcabral.com.br/login`, com `jordan@agency-alpha.test`.

Não rode o seed de novo. Ele recria as agências.

Confira `https://gridflow.maiconcabral.com.br/up`.

## GitHub Actions

| Workflow | Quando | O que faz |
| --- | --- | --- |
| `ci.yml` | Push em qualquer branch, exceto `main`, e pull requests | Pint e PHPUnit no backend (SQLite); `tsc --noEmit` e ESLint no frontend |
| `deploy.yml` | Push na `main` ou manual | Roda o CI. Publica `grid-api` e `grid-web` no GHCR com as tags `latest` e `sha-<commit>`. Copia os arquivos da stack, dá `pull` e `up`, roda `migrate --force` e `storage:link`. Termina conferindo `/up` |

A imagem do Next recebe `NEXT_PUBLIC_API_URL=https://<DEPLOY_DOMAIN>` no build. Sem a variable, o job da imagem web para.

Configure em **Settings → Secrets and variables → Actions**:

- **Secrets:** `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (chave privada sem senha) e `VPS_PORT` (opcional, padrão 22).
- **Variable:** `DEPLOY_DOMAIN`. No teste: `gridflow.maiconcabral.com.br`, sem `https://`.

O deploy usa o ambiente `demo`. Crie-o em **Settings → Environments** se quiser exigir aprovação manual.

O token do próprio workflow faz o login no GHCR durante o deploy, então a VPS não precisa guardar credenciais. Para ver as imagens sem login, torne os pacotes públicos em **Packages → Package settings**.

O primeiro deploy só acontece quando este código está na `main`.

## Ajustes da primeira subida

A primeira publicação em `gridflow.maiconcabral.com.br` passou por estes pontos. O código e este guia já ficaram com o resultado.

| O que apareceu | Causa | O que ficou |
| --- | --- | --- |
| `bootstrap/cache directory must be present` na imagem `grid-api` | O `.dockerignore` tira essa pasta, e o `package:discover` rodava antes do `mkdir` | `deploy/api.Dockerfile` cria `bootstrap/cache` e as pastas de `storage` antes do `composer dump-autoload` |
| `sed: can't read .env` | O workflow lia `/opt/grid` e o arquivo estava em outra pasta | Pasta da stack e destino do Actions: `/opt/gridflow`. O projeto inteiro não vai por FTP. Só o `.env` nasce na VPS |
| `container grid-mysql-1 is unhealthy` | A senha de root começava com `!`. O healthcheck do MySQL devolve erro e o Compose não sobe a API | Senhas só com letras e números. Com o volume `grid_mysql-data` recém-criado e sem dados, `docker compose down` e `docker volume rm grid_mysql-data` deixam o MySQL nascer de novo |
| `client_max_body_size directive is duplicate` e a API unhealthy | A imagem serversideup já grava esse limite a partir de `PHP_POST_MAX_SIZE`. Um segundo arquivo em `/etc/nginx/conf.d` derruba o nginx da API | O `printf` saiu do Dockerfile. Os 110 MB continuam em `PHP_POST_MAX_SIZE` e `PHP_UPLOAD_MAX_FILE_SIZE`. O `router.conf` mantém o limite do nginx da frente |
| `https://…/up` com 502, com os containers saudáveis | O proxy host apontava para `gridflow`, e não existe container com esse nome | Forward hostname `grid-router`, porta `80`, scheme `http`. A rede continua `grid_proxy`, a mesma em que o `nginx-proxy-manager` já está. Não usar `gridflow_proxy` |
| Login com `These credentials do not match our records` | O deploy migra e não semeia | `docker compose exec api php artisan db:seed --force` uma vez |

O HTML de `/up` com **Application up** confirma o caminho NPM → `grid-router` → API. O teste de dentro do NPM é `docker exec nginx-proxy-manager curl -fsS http://grid-router/up`.

## Operação

```bash
cd /opt/gridflow
docker compose ps
docker compose logs -f api web     # logs (LOG_CHANNEL=stderr na API)
```

### Voltar para uma versão anterior

```bash
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=sha-<commit>/' .env
docker compose pull && docker compose up -d --wait
```

A imagem web dessa tag já traz o `NEXT_PUBLIC_API_URL` de quando ela foi construída.

## Teste local dos contêineres (opcional)

Este teste não substitui o XAMPP e não usa as portas 80, 443 ou 3306.

```bash
cp deploy/.env.example deploy/.env
```

No `deploy/.env`, use:

- `http://localhost:8088` em `APP_URL` e `NEXT_PUBLIC_API_URL`;
- `SESSION_SECURE_COOKIE=false`;
- `NPM_NETWORK=grid-local-proxy`.

Depois:

```bash
docker network create grid-local-proxy
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.local.yml --env-file deploy/.env up -d --build
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.local.yml --env-file deploy/.env exec api php artisan migrate --force
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.local.yml --env-file deploy/.env exec api php artisan db:seed --force
```

Abra `http://localhost:8088`.
