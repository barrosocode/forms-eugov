# Forms Jabatec

Dashboard para criar formulários internos e a página para respondê-los. O frontend é Next.js e consome a API FastAPI descrita em `docs/API.md`.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abra `http://localhost:3000`. A API precisa estar em `http://localhost:8000`.

Credencial local da API: `admin@example.com` / `password123`.

`npm test` roda as regras de permissão, máscara, envelope e respostas. `make help` lista os atalhos.
