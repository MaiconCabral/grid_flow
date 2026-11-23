# Etapa 2 — Team & Clients

A tela `/{slug}/team` deixa de ser um aviso e passa a gerir a equipe e as marcas da agência logada.

Só o papel `agency_admin` vê as listas e os formulários. Designer, redator e cliente veem a mensagem de que apenas o Agency Admin gerencia a equipe. A página não chama `GET /users` nem `GET /workspaces` nesse caso.

A interface continua em inglês. O seletor “Viewing as” não muda o papel real.

Sucesso e erro aparecem no SweetAlert, com fundo, texto e botão nas cores do tema claro ou escuro. O lightbox de Clients usa as mesmas variáveis do layout, então acompanha essa escolha, inclusive os campos nativos.

O admin cria o colega ou o cliente já com senha. Na seção Clients, o botão Add clients abre um lightbox com as abas Brands e Users. Editar uma marca ou um cliente reabre esse mesmo lightbox com a aba e os campos preenchidos. O aceite de convite em `invite/[token]` continua para uma etapa futura, junto com o e-mail transacional.
