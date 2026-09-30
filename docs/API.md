# Documentação da API — Forms Jabatec

API interna para autenticação, usuários, papéis e formulários. Base local: `http://localhost:8000`.

Com `APP_DEBUG=true`, o Swagger fica em `http://localhost:8000/docs`.

## Como consumir

Envie JSON com o cabeçalho `Content-Type: application/json`. Rotas protegidas exigem:

```http
Authorization: Bearer <access_token>
```

O access token dura 15 minutos (`expires_in: 900`). Ele volta no corpo do login e da renovação. O refresh token não volta no JSON: a API grava o cookie `refresh_token` (`HttpOnly`, `SameSite=Strict`, caminho `/api/v1/auth`, 7 dias). Em `APP_ENV=local` o cookie não usa `Secure`, para funcionar em HTTP. Fora de `local`, `Secure` fica ligado.

No navegador, chame a API com credenciais (`credentials: "include"` ou `withCredentials: true`) para o cookie ir e voltar. Cliente sem cookie pode mandar o refresh token no header `Authorization: Bearer` só em `POST /api/v1/auth/refresh`. Não guarde o refresh token em `localStorage`.

Origens liberadas no CORS local: `http://localhost:3000` e `http://localhost:8000`, com credenciais.

Não existe cadastro público. O administrador cria os usuários.

Credencial local do seed, só para desenvolvimento: `admin@example.com` / `password123`.

### Fluxo mínimo

1. `POST /api/v1/auth/login` com email e senha.
2. Guarde o `access_token` em memória e deixe o cliente guardar o cookie.
3. Chame as rotas com `Authorization: Bearer`.
4. Perto dos 15 minutos, `POST /api/v1/auth/refresh`.
5. `POST /api/v1/auth/logout` invalida os refresh tokens daquele usuário.

Se um refresh já usado for apresentado de novo, a API invalida todos os refresh tokens daquele usuário.

## Formato das respostas

Toda resposta é um objeto. Sucesso:

```json
{
    "status": 200,
    "message": "Mensagem em português",
    "errors": {},
    "recurso": {},
    "error_code": null
}
```

A chave do recurso muda conforme a rota: `health`, `auth`, `user`, `users`, `role`, `roles`, `form`, `forms`, `section`, `sections`, `question`, `questions`, `option`, `options`, `member`, `members`, `response`, `responses`, `favorite`, `favorites`, `favorite_summary`, `report`.

Listas incluem `pagination`. Respostas de um único item não trazem essa chave.

```json
{
    "page": 1,
    "page_size": 15,
    "total_items": 42,
    "total_pages": 3
}
```

`page` começa em 1. `page_size` padrão é 15 e o máximo é 100.

Erro:

```json
{
    "status": 422,
    "message": "Erro de validação.",
    "errors": {
        "email": ["O campo email é obrigatório."]
    },
    "resource": null,
    "pagination": null,
    "error_code": "VALIDATION_ERROR"
}
```

Em erro de validação de entrada a chave do recurso é `resource`. Em `401` ela é `auth`. Nos demais erros de regra ela acompanha o recurso da rota (`user`, `form`, `response`, etc.).

| HTTP | `error_code`       | Quando acontece                                             |
| ---- | ------------------ | ----------------------------------------------------------- |
| 401  | `HTTP_401`         | Sem token, token inválido ou credenciais de login inválidas |
| 403  | `HTTP_403`         | Autenticado, mas sem permissão ou sem ser owner             |
| 404  | `HTTP_404`         | Rota ou registro inexistente                                |
| 405  | `HTTP_405`         | Método não aceito na rota                                   |
| 409  | `HTTP_409`         | Email, CPF, nome de papel ou membro duplicado               |
| 422  | `VALIDATION_ERROR` | Corpo, query ou regra de negócio inválidos                  |
| 500  | `HTTP_500`         | Falha interna. A mensagem não descreve o erro técnico       |

Login com senha errada, usuário inexistente ou usuário inativo responde sempre `401` com a mensagem `Credenciais inválidas.`

Campos desconhecidos no JSON são recusados. Datas saem em ISO 8601 com fuso UTC. IDs são UUID.

## Saúde

| Método | Rota             | Auth    |
| ------ | ---------------- | ------- |
| GET    | `/health`        | Pública |
| GET    | `/api/v1/health` | Pública |

```json
{
    "status": 200,
    "message": "Serviço operando normalmente.",
    "errors": {},
    "health": {"status": "ok", "timestamp": "2026-09-29T20:00:00+00:00"},
    "error_code": null
}
```

## Autenticação

### POST `/api/v1/auth/login`

Público.

```json
{"email": "admin@example.com", "password": "password123"}
```

`password` tem de 8 a 72 caracteres.

Sucesso `200`, chave `auth`:

```json
{
    "access_token": "<jwt>",
    "token_type": "bearer",
    "expires_in": 900
}
```

Além do corpo, a resposta envia `Set-Cookie: refresh_token=...`.

Erros: `401` credenciais inválidas, `422` email ou senha fora do formato.

### POST `/api/v1/auth/refresh`

Público no sentido de não usar o access token. Envie o cookie ou `Authorization: Bearer <refresh_token>`. Se os dois existirem, o header vale.

Sucesso `200`, mesmo objeto `auth` do login, com cookie novo. O refresh anterior deixa de valer.

Erros: `401` token ausente, expirado, revogado ou reutilizado.

### POST `/api/v1/auth/logout`

Access token. Invalida os refresh tokens do usuário e apaga o cookie.

```json
{"logged_out": true}
```

### GET `/api/v1/auth/me`

Access token. Devolve o próprio usuário, com `cpf` e `permissions`. CPF de outra pessoa não aparece em nenhuma rota.

### PUT `/api/v1/auth/me`

Atualização parcial: só os campos enviados mudam. Enviar `null` em `phone`, `cpf` ou `avatar_url` limpa o campo.

```json
{
    "name": "Ana Lima",
    "email": "ana@example.com",
    "phone": "11987654321",
    "cpf": "529.982.247-25",
    "avatar_url": "https://example.com/avatar.png",
    "password": "novaSenha1",
    "current_password": "password123"
}
```

Trocar `password` exige `current_password`. Telefone aceita máscara e é guardado só com dígitos (10 a 13). CPF aceita máscara, é validado e guardado só com dígitos.

Erros: `422` senha atual incorreta ou CPF/telefone inválidos, `409` email ou CPF já usado.

## Usuários

Exigem a permissão indicada. O papel `admin` tem `*` e passa em todas. O papel `user` não gerencia usuários.

O objeto de usuário, fora de `/auth/me`, não inclui `cpf` nem senha. Listagem não inclui `permissions`. Detalhe, criação e atualização incluem `permissions`.

```json
{
    "id": "uuid",
    "name": "Ana Lima",
    "email": "ana@example.com",
    "phone": "11987654321",
    "avatar_url": null,
    "status": "active",
    "email_verified_at": "2026-09-29T20:00:00+00:00",
    "last_login_at": null,
    "roles": [{"id": "uuid", "name": "user", "display_name": "Usuário"}],
    "created_at": "2026-09-29T20:00:00+00:00",
    "updated_at": "2026-09-29T20:00:00+00:00"
}
```

`status`: `active`, `inactive`, `suspended`.

| Método | Rota                 | Permissão      | Sucesso              |
| ------ | -------------------- | -------------- | -------------------- |
| GET    | `/api/v1/users`      | `users:list`   | `200`, chave `users` |
| POST   | `/api/v1/users`      | `users:create` | `201`, chave `user`  |
| GET    | `/api/v1/users/{id}` | `users:view`   | `200`, chave `user`  |
| PUT    | `/api/v1/users/{id}` | `users:update` | `200`, chave `user`  |
| PATCH  | `/api/v1/users/{id}` | `users:update` | `200`, chave `user`  |
| DELETE | `/api/v1/users/{id}` | `users:delete` | `200`, chave `user`  |

Filtros da listagem: `name` (contém), `email` (igualdade exata), `status`, `created_at` (`YYYY-MM-DD`, dia UTC), `page`, `page_size`.

Criação:

```json
{
    "name": "Ana Lima",
    "email": "ana@example.com",
    "password": "password123",
    "phone": "(11) 98765-4321",
    "cpf": "529.982.247-25",
    "avatar_url": null,
    "status": "active",
    "role_ids": []
}
```

`role_ids` vazio atribui o papel `user`. `name` tem de 3 a 150 caracteres.

`PUT` substitui `name`, `email`, `status`, `phone`, `cpf`, `avatar_url` e `role_ids`. `role_ids` precisa ter ao menos um id. `password` é opcional.

`PATCH` altera só o que for enviado.

Exclusão é lógica. O corpo de sucesso é `{ "id": "<uuid>", "deleted": true }`. Não é possível excluir a si mesmo nem o último administrador ativo. Também não é possível tirar o papel `admin` ou inativar o último administrador ativo.

Erros comuns: `403` sem permissão, `404` usuário ou papel inexistente, `409` email ou CPF em uso, `422` validação ou último administrador.

## Papéis

| Método | Rota                 | Permissão      | Sucesso              |
| ------ | -------------------- | -------------- | -------------------- |
| GET    | `/api/v1/roles`      | `roles:list`   | `200`, chave `roles` |
| POST   | `/api/v1/roles`      | `roles:create` | `201`, chave `role`  |
| GET    | `/api/v1/roles/{id}` | `roles:view`   | `200`, chave `role`  |
| PUT    | `/api/v1/roles/{id}` | `roles:update` | `200`, chave `role`  |
| PATCH  | `/api/v1/roles/{id}` | `roles:update` | `200`, chave `role`  |
| DELETE | `/api/v1/roles/{id}` | `roles:delete` | `200`, chave `role`  |

Filtros: `name` (contém), `scope` (`master` ou `tenant`), `is_system` (`true` ou `false`), `page`, `page_size`.

```json
{
    "id": "uuid",
    "name": "editor",
    "display_name": "Editor",
    "description": null,
    "scope": "master",
    "is_system": false,
    "permissions": ["forms:list", "forms:view"],
    "created_at": "2026-09-29T20:00:00+00:00",
    "updated_at": "2026-09-29T20:00:00+00:00"
}
```

`name` usa letras, números e `_`, até 50 caracteres, e é gravado em minúsculas. `PUT` e `PATCH` são parciais.

Permissões que podem ser atribuídas:

`users:list`, `users:view`, `users:create`, `users:update`, `users:delete`, `roles:list`, `roles:view`, `roles:create`, `roles:update`, `roles:delete`, `forms:list`, `forms:view`, `forms:create`, `forms:update`, `forms:delete`, `responses:list`, `responses:create`.

A permissão `*` não pode ser atribuída por esta API. Os papéis `admin` e `user` são de sistema: não podem ser alterados nem excluídos. Papel atribuído a alguém também não pode ser excluído (`409`).

O papel `user` do seed recebe `forms:list`, `forms:view`, `forms:create`, `responses:list` e `responses:create`.

## Formulários

Criar formulário exige `forms:create`. As permissões `forms:list`, `forms:view`, `forms:update`, `forms:delete`, `responses:list` e `responses:create` existem no catálogo, mas as rotas correspondentes não as consultam: usam o access token e a relação da pessoa com o formulário.

Listagens de seções, perguntas, opções, membros, respostas e favoritos também aceitam `page` e `page_size`.

- Administrador (`*`) vê e altera tudo.
- Quem cria o formulário vira `owner`.
- `owner` edita estrutura, membros, status e vê todas as respostas.
- `member` vê o formulário e responde. Não edita estrutura nem membros.
- Formulário `published` pode ser lido e respondido por qualquer usuário autenticado.
- Formulário `draft` ou `archived` só é visível para membros e administrador.
- Estrutura de formulário `archived` não pode ser editada. Dá para mudar só o `status`, por exemplo de volta para `draft`.

`order` começa em 0 e não tem buracos. Se o campo for omitido na criação, o item entra no fim. Ao excluir, a sequência é recompactada.

### Formulário

| Método | Rota                 | Sucesso                                             |
| ------ | -------------------- | --------------------------------------------------- |
| POST   | `/api/v1/forms`      | `201`, chave `form`                                 |
| GET    | `/api/v1/forms`      | `200`, chave `forms`                                |
| GET    | `/api/v1/forms/{id}` | `200`, chave `form`, com seções, perguntas e opções |
| PATCH  | `/api/v1/forms/{id}` | `200`, chave `form`                                 |
| DELETE | `/api/v1/forms/{id}` | `200`, `{ "id", "deleted": true }`                  |

A listagem do administrador traz todos os formulários não excluídos. Os demais veem só aqueles em que participam. Filtros: `title` (contém), `status` (`draft`, `published`, `archived`), `page`, `page_size`. A listagem não aninha seções.

```json
{
    "id": "uuid",
    "title": "Pesquisa interna",
    "description": "Clima do time",
    "status": "draft",
    "created_by": "uuid",
    "my_role": "owner",
    "created_at": "2026-09-29T20:00:00+00:00",
    "updated_at": "2026-09-29T20:00:00+00:00",
    "sections": []
}
```

`my_role` é `owner`, `member` ou `null`.

Criação: `title` (3 a 200) e `description` opcional (até 5000). O status inicial é `draft`.

Atualização parcial: `title`, `description`, `status`. Publicar (`status: "published"`) exige ao menos uma seção, cada seção com ao menos uma pergunta, e cada pergunta `radio`, `checkbox`, `select` ou `classification` com ao menos duas opções. A exclusão é lógica.

### Seções

| Método | Rota                          | Sucesso                            |
| ------ | ----------------------------- | ---------------------------------- |
| GET    | `/api/v1/forms/{id}/sections` | `200`, chave `sections`            |
| POST   | `/api/v1/forms/{id}/sections` | `201`, chave `section`             |
| PATCH  | `/api/v1/sections/{id}`       | `200`, chave `section`             |
| DELETE | `/api/v1/sections/{id}`       | `200`, `{ "id", "deleted": true }` |

```json
{
    "title": "Geral",
    "description": null,
    "order": 0
}
```

`title` de 1 a 200. `description` até 5000. `order` opcional e maior ou igual a zero. A listagem de seções não aninha perguntas. Um formulário publicado não pode ficar sem seção.

### Perguntas

| Método | Rota                              | Sucesso                            |
| ------ | --------------------------------- | ---------------------------------- |
| GET    | `/api/v1/sections/{id}/questions` | `200`, chave `questions`           |
| POST   | `/api/v1/sections/{id}/questions` | `201`, chave `question`            |
| PATCH  | `/api/v1/questions/{id}`          | `200`, chave `question`            |
| DELETE | `/api/v1/questions/{id}`          | `200`, `{ "id", "deleted": true }` |

```json
{
    "title": "Como foi o dia?",
    "type": "short",
    "required": true,
    "order": 0
}
```

`type`: `short`, `long`, `radio`, `checkbox`, `select`, `classification`. O tipo não muda depois da criação. `PATCH` aceita `title`, `required` e `order`. Uma seção publicada não pode ficar sem pergunta.

`short` e `long` são texto e não aceitam opções. `radio`, `select` e `classification` são uma opção só. `checkbox` é uma lista de opções.

### Opções

| Método | Rota                             | Sucesso                            |
| ------ | -------------------------------- | ---------------------------------- |
| GET    | `/api/v1/questions/{id}/options` | `200`, chave `options`             |
| POST   | `/api/v1/questions/{id}/options` | `201`, chave `option`              |
| PATCH  | `/api/v1/options/{id}`           | `200`, chave `option`              |
| DELETE | `/api/v1/options/{id}`           | `200`, `{ "id", "deleted": true }` |

```json
{"value": "Bom", "order": 0}
```

`value` de 1 a 300. Criar opção em pergunta de texto responde `422`. Uma pergunta de escolha publicada precisa manter ao menos duas opções.

### Membros

Só owner ou administrador.

| Método | Rota                                   | Sucesso                                 |
| ------ | -------------------------------------- | --------------------------------------- |
| GET    | `/api/v1/forms/{id}/members`           | `200`, chave `members`                  |
| POST   | `/api/v1/forms/{id}/members`           | `201`, chave `member`                   |
| PATCH  | `/api/v1/forms/{id}/members/{user_id}` | `200`, chave `member`                   |
| DELETE | `/api/v1/forms/{id}/members/{user_id}` | `200`, `{ "user_id", "deleted": true }` |

```json
{"user_id": "uuid", "role": "member"}
```

`role`: `owner` ou `member`. O usuário precisa existir e estar ativo. Não dá para repetir um membro nem remover ou rebaixar o último owner.

```json
{
    "id": "uuid",
    "form_id": "uuid",
    "user_id": "uuid",
    "user_name": "Ana Lima",
    "user_email": "ana@example.com",
    "role": "member",
    "created_at": "2026-09-29T20:00:00+00:00"
}
```

### Respostas

| Método | Rota                                | Quem                                                 | Sucesso                            |
| ------ | ----------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| POST   | `/api/v1/forms/{id}/responses`      | Usuário autenticado, formulário publicado            | `201`, chave `response`            |
| GET    | `/api/v1/forms/{id}/responses`      | Owner e admin veem todas; os demais veem as próprias | `200`, chave `responses`           |
| GET    | `/api/v1/forms/{id}/responses/{id}` | Owner, admin ou autor                                | `200`, chave `response`            |
| DELETE | `/api/v1/forms/{id}/responses/{id}` | Owner, admin ou autor                                | `200`, `{ "id", "deleted": true }` |

```json
{
    "answers": [
        {"question_id": "uuid-da-pergunta-texto", "value": "Foi um bom dia"},
        {"question_id": "uuid-da-escolha-unica", "value": "uuid-da-opcao"},
        {"question_id": "uuid-do-checkbox", "value": ["uuid-da-opcao-a", "uuid-da-opcao-b"]}
    ]
}
```

`short` aceita até 200 caracteres. `long` aceita até 5000. Pergunta obrigatória não pode faltar. Cada pergunta entra uma vez. Opções precisam pertencer à pergunta. Formulário em rascunho ou arquivado responde `422` na hora de responder.

```json
{
    "id": "uuid",
    "form_id": "uuid",
    "respondent_id": "uuid",
    "respondent_name": "Ana Lima",
    "respondent_email": "ana@example.com",
    "answers": [{"question_id": "uuid", "value": "Foi um bom dia", "favorited": false}],
    "created_at": "2026-09-29T20:00:00+00:00"
}
```

`favorited` diz se aquela resposta da pergunta está marcada para o relatório. O JSON das respostas fica criptografado no banco. A marcação não entra nesse JSON.

### Favoritos

Só owner ou administrador. Formulário em rascunho responde `422`. Publicado e arquivado aceitam. Só perguntas `short` e `long`, e a resposta precisa ter texto para essa pergunta. Marcar de novo a mesma pergunta na mesma resposta devolve o favorito já existente, com `200`.

| Método | Rota                                                        | Sucesso                                                      |
| ------ | ----------------------------------------------------------- | ------------------------------------------------------------ |
| POST   | `/api/v1/forms/{id}/responses/{id}/favorites`               | `201` na primeira vez, `200` se já existia, chave `favorite` |
| DELETE | `/api/v1/forms/{id}/responses/{id}/favorites/{question_id}` | `200`, `{ "id", "deleted": true }`                           |
| GET    | `/api/v1/forms/{id}/favorites`                              | `200`, chave `favorites`                                     |
| GET    | `/api/v1/forms/{id}/favorites/summary`                      | `200`, chave `favorite_summary`                              |

```json
{"question_id": "uuid-da-pergunta-texto"}
```

```json
{
    "id": "uuid",
    "form_response_id": "uuid",
    "question_id": "uuid",
    "favorited_by": "uuid",
    "created_at": "2026-09-30T18:00:00+00:00"
}
```

A lista aceita `question_id`, `page` e `page_size`. Cada item traz o texto só da pergunta favoritada. A consulta parte da tabela de favoritos e descriptografa apenas a página.

```json
{
    "id": "uuid",
    "form_response_id": "uuid",
    "question_id": "uuid",
    "value": "Foi um bom dia",
    "respondent_id": "uuid",
    "respondent_name": "Ana Lima",
    "favorited_by": "uuid",
    "created_at": "2026-09-30T18:00:00+00:00"
}
```

O resumo não é paginado: é um único objeto, com uma entrada por pergunta `short` ou `long` do formulário, inclusive quando ninguém favoritou.

```json
{
    "form_id": "uuid",
    "total_responses": 120,
    "questions": [
        {
            "question_id": "uuid",
            "title": "Como foi o dia?",
            "total_favorited": 18,
            "percentage": 15.0
        }
    ]
}
```

`percentage` é `total_favorited / total_responses * 100`, com até duas casas. O denominador é o total de respostas não excluídas do formulário. Pergunta opcional entra nessa conta mesmo quando a pessoa não escreveu texto. Desfavoritar apaga a linha. Excluir a resposta também apaga os favoritos dela.

### Relatório

Só owner ou administrador. Rascunho responde `422`. Publicado e arquivado aceitam. É um único objeto, sem paginação.

| Método | Rota                        | Sucesso               |
| ------ | --------------------------- | --------------------- |
| GET    | `/api/v1/forms/{id}/report` | `200`, chave `report` |

```json
{
    "form_id": "uuid",
    "total_responses": 10,
    "questions": [
        {
            "question_id": "uuid",
            "title": "Nota",
            "type": "radio",
            "chart": "pie",
            "options": [{"option_id": "uuid", "value": "Baixa", "abs": 5, "percent": 50.0}]
        },
        {
            "question_id": "uuid",
            "title": "Temas",
            "type": "checkbox",
            "chart": "bar",
            "options": [{"option_id": "uuid", "value": "Prazo", "abs": 8, "percent": 80.0}]
        },
        {
            "question_id": "uuid",
            "title": "Como foi o dia?",
            "type": "short",
            "chart": "starred",
            "percent_starred": 60.0,
            "starred_responses": [
                {
                    "form_response_id": "uuid",
                    "value": "Foi um bom dia",
                    "respondent_name": "Ana Lima"
                }
            ]
        }
    ]
}
```

`chart` é `pie` para `radio`, `select` e `classification`, `bar` para `checkbox` e `starred` para `short` e `long`. Pergunta de escolha não traz `percent_starred`. Pergunta de texto não traz `options`. Opção sem marcação continua na lista, com `abs` zero.

Na pizza, o denominador é quem escolheu uma opção que ainda existe. Quem pulou a pergunta fica de fora, e as fatias fecham em 100%, salvo arredondamento de duas casas. Na barra, o denominador é quem marcou ao menos uma opção ainda existente. Cada `percent` é as marcações daquela opção sobre esse total, então a soma pode passar de 100%. `percent_starred` usa o total de respostas do formulário, como o resumo de favoritos. A lista traz só os textos marcados, do favorito mais recente para o mais antigo, sem e-mail.

## Exemplo encadeado

```bash
curl -s -c cookies.txt -X POST http://localhost:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password123"}'
```

Use o `access_token` do corpo nas chamadas seguintes.

```bash
curl -s -X POST http://localhost:8000/api/v1/forms \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Pesquisa interna"}'
```

Crie uma seção, uma pergunta `short` obrigatória, publique com `{ "status": "published" }` e envie a resposta no formato da seção anterior. Para renovar a sessão pelo cookie:

```bash
curl -s -b cookies.txt -c cookies.txt -X POST http://localhost:8000/api/v1/auth/refresh
```
