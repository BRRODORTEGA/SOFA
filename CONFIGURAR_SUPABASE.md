# Configuração do Supabase

## Passo 1: Obter a Senha do Banco de Dados

1. Acesse o [painel do Supabase](https://app.supabase.com/)
2. Selecione o projeto: `pyranpqcxxbadjjshxax`
3. Vá em **Settings** → **Database**
4. Na seção **Connection string**, você verá a senha ou pode resetá-la
5. Copie a senha do banco de dados

## Passo 2: Atualizar o arquivo .env

Abra o arquivo `.env` na raiz do projeto e atualize a linha `DATABASE_URL`:

```
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@pyranpqcxxbadjjshxax.supabase.co:5432/postgres?sslmode=require
```

**Substitua `SUA_SENHA_AQUI` pela senha real do seu banco Supabase.**

## Passo 3: Configurar SSL no Prisma (se necessário)

O Supabase requer SSL. Se houver problemas de conexão, adicione ao `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")  // Para migrations
}
```

## Passo 4: Executar Migrações

Após configurar o `.env`:

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar as tabelas no Supabase
npx prisma migrate dev --name init
```

## Passo 5: Reiniciar o Servidor

Pare o servidor Next.js (Ctrl+C) e inicie novamente:

```bash
npm run dev
```

## Verificar Conexão

Para testar se está conectando:

```bash
npx prisma studio
```

Isso abrirá o Prisma Studio conectado ao seu banco Supabase.

## Nota de Segurança

⚠️ **Nunca commite o arquivo `.env` no Git!** Ele já está no `.gitignore`.




