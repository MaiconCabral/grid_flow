# Etapa 6 — Dashboard

`GET /api/v1/dashboard` usa o mesmo corte do quadro. O admin vê a agência. Designer e redator veem só as tarefas em que são o responsável. O cliente vê só a marca dele, e só as tarefas em Pending Approval, Approved e Scheduled. Outra agência não entra. Não há cache: Redis continua na etapa de nuvem.

A resposta traz as cinco colunas, o que está atrasado, o que vence nesta semana (segunda a domingo), até cinco tarefas que pedem ação, os últimos eventos e as marcas. Para o cliente a lista de marcas volta vazia. A ação do cliente são as peças em Pending Approval.

`GET /api/v1/settings` passa a responder 403 para quem não é admin. O tema segue em `GET /api/v1/auth/me`.
