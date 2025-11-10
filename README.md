# Room2Go — Fase 1 (Base)

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma (PostgreSQL)
- Auth.js (NextAuth) — mock credentials por enquanto
- Resend (e-mails) — mock se não houver API key

## Setup

1. Copie `.env.example` para `.env` e ajuste as variáveis.

2. Instale dependências: `npm i`

3. Rode o dev server: `npm run dev` (http://localhost:3000)

> O schema do Prisma será adicionado na **Fase 2**.
> A autenticação real (Prisma Adapter, usuários) será configurada na **Fase 6**.

## Estrutura

- `/app/(storefront)` — loja (home)
- `/app/(admin)` — admin (layout base)
- `/app/(auth)/login` — login (mock)
- `/app/api` — APIs (health, auth)
- `/lib` — helpers (env, email, prisma)
- `/prisma` — schema e seed (vão evoluir)

## Testes rápidos

- Acesse `/` (Storefront)
- Acesse `/admin` (apenas layout por enquanto)
- Login em `/auth/login` com `admin@local` / `admin` (mock)
- Health: `/api/health`




