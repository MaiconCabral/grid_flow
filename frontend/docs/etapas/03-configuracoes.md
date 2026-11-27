# Etapa 3 — Settings

A tela `/{slug}/settings` tem três abas. A interface continua em inglês.

## Agency

Mostra o nome e o slug. O admin edita o nome e salva. O slug fica só leitura. Os outros papéis não abrem a tela: a página diz que não está disponível.

## Appearance

Dark e Light, o fundo claro, o fundo escuro e o destaque são da agência. As cores são amostras, não um seletor livre:

- fundo claro: Mist, White, Sand
- fundo escuro: Ink, Graphite, Ash
- destaque: Lime, Violet, Sky, Amber, Rose, Teal, Coral

Só o admin grava. O botão de tema no topo também grava `theme` no banco quando quem clica é o admin; para os demais ele fica desabilitado. Sucesso e erro usam o SweetAlert.

O shell aplica as variáveis `--background`, `--sidebar`, `--card`, `--raised`, `--soft`, `--lime`, `--lime-dark` e `--good`. Card, raised e soft saem da cor de fundo escolhida.

## Plans

Starter, Studio e Agency continuam no código e no `GET /settings`, como informação. A aba Plans está oculta por `showVisualPlaceholders`. Ninguém troca de plano nesta etapa.

## Menu e marca

No menu, o nome da agência substitui “morrow BETA”. O ícone de estrela vira uma grade (`LayoutGrid`). No login e no cadastro a marca é **Post Grid**, com o mesmo ícone. O título do browser segue esse nome.

## Arquivos

- `src/components/settings/settings-view.tsx` — abas
- `src/lib/agency-theme.ts` — aplica e guarda a cópia visual
- `src/components/shell/sidebar.tsx` — nome e ícone
- `src/components/auth/auth-frame.tsx` — marca Post Grid
