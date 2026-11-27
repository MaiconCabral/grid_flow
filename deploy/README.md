# Deploy do servidor de teste

O GridFlow roda numa VPS da Hostinger, atrás do Nginx Proxy Manager (NPM) que já atende outros sites. Esta instância é para testar. Os dados ficam: cada deploy só aplica as migrations novas.

Nada desta pasta muda o desenvolvimento local, que continua com XAMPP, `php artisan serve` e `npm run dev`.

## Como funciona

```text
Internet → NPM (80/443, certificado de grid.<dominio>)
         → grid-router (nginx, só na rede do NPM, sem porta pública)
              /api, /storage, /up → api   (Laravel: PHP-FPM + nginx)
              o resto             → web   (Next.js)
         mysql 8.4, um banco (grid_flow)
```

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

No painel do domínio, crie um registro A apontando para o IP da VPS:

- `grid`

### 2. Certificado no NPM

Em **SSL Certificates → Add → Let's Encrypt**, peça o certificado de `grid.<dominio>`. Um nome só, pelo desafio HTTP, chega. Não precisa de wildcard.

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

- Troque `grid.example.com` pelo domínio real em `APP_URL`, `MAIL_FROM_ADDRESS` e `NEXT_PUBLIC_API_URL`.
- `GHCR_NAMESPACE` é o usuário ou a organização do GitHub, em minúsculas, o mesmo dono dos pacotes `grid-api` e `grid-web`.
- Preencha `MYSQL_ROOT_PASSWORD` e `DB_PASSWORD`.
- Gere a `APP_KEY` com:

  ```bash
  docker run --rm ghcr.io/<dono>/grid-api:latest php artisan key:generate --show
  ```

  Na primeira vez a imagem ainda não existe. Gere a chave localmente com `php artisan key:generate --show` dentro de `backend/` e cole o valor.

`NEXT_PUBLIC_API_URL` no `.env` da VPS não muda o site já publicado. O Next grava esse endereço na imagem, no build. O workflow usa a variable `DEPLOY_DOMAIN`.

### 5. Proxy host no NPM

- **Domain names:** `grid.<dominio>`.
- **Forward:** `http`, host `grid-router`, porta `80`.
- **SSL:** o certificado desse nome, com *Force SSL* e *HTTP/2*.

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

O seed roda uma vez. Ele cria as agências de demonstração. A senha de todas as contas é `password`. A lista está em [01-autenticacao.md](../backend/docs/etapas/01-autenticacao.md). Para entrar: `https://grid.<dominio>/login`, com `jordan@agency-alpha.test`.

Os deploys seguintes não rodam o seed, para não recriar o que já foi testado.

Confira `https://grid.<dominio>/up`.

## GitHub Actions

| Workflow | Quando | O que faz |
| --- | --- | --- |
| `ci.yml` | Push em qualquer branch, exceto `main`, e pull requests | Pint e PHPUnit no backend (SQLite); `tsc --noEmit` e ESLint no frontend |
| `deploy.yml` | Push na `main` ou manual | Roda o CI. Publica `grid-api` e `grid-web` no GHCR com as tags `latest` e `sha-<commit>`. Copia os arquivos da stack, dá `pull` e `up`, roda `migrate --force` e `storage:link`. Termina conferindo `/up` |

A imagem do Next recebe `NEXT_PUBLIC_API_URL=https://<DEPLOY_DOMAIN>` no build. Sem a variable, o job da imagem web para.

Configure em **Settings → Secrets and variables → Actions**:

- **Secrets:** `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (chave privada sem senha) e `VPS_PORT` (opcional, padrão 22).
- **Variable:** `DEPLOY_DOMAIN`, por exemplo `grid.seudominio.com.br`.

O deploy usa o ambiente `demo`. Crie-o em **Settings → Environments** se quiser exigir aprovação manual.

O token do próprio workflow faz o login no GHCR durante o deploy, então a VPS não precisa guardar credenciais. Para ver as imagens sem login, torne os pacotes públicos em **Packages → Package settings**.

O primeiro deploy só acontece quando este código está na `main`.

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
