# Módulo Forms

Formulários internos da Jabatec. Depende de Users e Roles.

## Entidades

- Form: `title`, `description` opcional, `status` (`draft`, `published`, `archived`), `created_by`.
- FormMembership: usuário no formulário com papel `owner` ou `member`.
- Section: pertence ao formulário, `title`, `description`, `order` contínuo a partir de zero.
- Question: pertence à seção, `title`, `type` (`short`, `long`, `radio`, `checkbox`, `select`, `classification`), `required`, `order` contínuo dentro da seção.
- Option: pertence à pergunta de escolha, `value`, `order`.
- FormResponse: pertence ao formulário, autor autenticado, `responses` JSON criptografado.

## Regras

- Publicar exige ao menos uma seção, cada seção com ao menos uma pergunta, e perguntas de escolha com ao menos duas opções.
- Arquivado não recebe edição estrutural nem respostas.
- Não é possível remover o último owner.
- Coleções expostas em lista são paginadas.

## Permissões

- `forms:create`, `forms:list`, `forms:view` para o papel `user`.
- `responses:create`, `responses:list` para o papel `user`.
- Alteração de estrutura, membros e exclusão: owner ou administrador.

## Interface (Next.js)

O schema em `docs/modules/forms/schema/forms.json` permanece o contrato de dados. Esta aplicação não cria tabelas: consome a API descrita em `docs/API.md`.

- `/signin`: e-mail e senha. Sem cadastro público.
- `/dashboard`: saudação e formulários recentes.
- `/forms`: lista paginada, filtro de título a partir de 2 caracteres e filtro de status.
- `/forms/new`: cria rascunho e abre o construtor.
- `/forms/[id]`: título, descrição, status, seções, perguntas, opções e membros.
- `/forms/[id]/responses` e `/forms/[id]/responses/[responseId]`: lista e detalhe.
- `/f/[id]`: página de resposta, com visual limpo. Exige sessão porque a API só aceita usuário autenticado.
- `/users` e `/roles`: gestão administrativa conforme permissão.
- `/profile`: dados do próprio usuário, inclusive CPF.

Tokens ficam em cookies HttpOnly no domínio do Next.js. O navegador não recebe o access token no JSON.
