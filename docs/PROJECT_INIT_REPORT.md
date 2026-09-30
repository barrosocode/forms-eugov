# Relatório de inicialização — Forms Jabatec

## Stack

- Next.js 16.3.1
- React 19.2
- TypeScript 5
- Tailwind CSS 4
- API FastAPI externa em `http://localhost:8000` (contrato em `docs/API.md`)

## Decisões

- Este repositório é o frontend. A API, o banco e o seed ficam no serviço descrito em `docs/API.md`.
- Registro público desligado. A tela de login não oferece cadastro.
- Sem multi-tenancy e sem header `X-Tenant-ID`.
- TailAdmin não existe como template neste ambiente. O visual segue o padrão de dashboard (sidebar escura, cartões, tipografia Geist) com Tailwind.
- O access token da API não chega ao JavaScript. O Next.js grava access e refresh em cookies HttpOnly e encaminha as chamadas por `/api/backend`.
- A página `/f/[id]` é a tela de resposta. Ela exige login porque a API só aceita usuário autenticado, inclusive em formulário publicado.

## Como rodar

API (serviço separado):

```bash
make up
make migrate
make seed
```

Frontend, nesta pasta:

```bash
cp .env.example .env.local
npm install
npm run dev
```

App em `http://localhost:3000`. Credencial local da API: `admin@example.com` / `password123`.

Testes do frontend: `npm test`. Qualidade: `npm run lint` e `npm run build`.

## Páginas

| Rota | Auth |
| --- | --- |
| `/signin` | Pública |
| `/dashboard` | Sessão |
| `/forms` | `forms:list` |
| `/forms/new` | `forms:create` |
| `/forms/[id]` | Sessão e relação com o formulário |
| `/forms/[id]/responses` | Sessão |
| `/f/[id]` | Sessão |
| `/users` | `users:list` |
| `/roles` | `roles:list` |
| `/profile` | Sessão |

## MCP

`.cursor/mcp.json` aponta para `postgresql://postgres:postgres@localhost:5432/forms_jabatec`. O frontend não gera migration. Se o servidor MCP não estiver instalado: `sudo npm install -g @modelcontextprotocol/server-postgres`.
