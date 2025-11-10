# Verificação da Conexão Supabase

## Problema: DNS não resolve o hostname

O erro indica que o hostname `db.pyranpqcxxbadjjshxax.supabase.co` não está sendo resolvido.

## Soluções possíveis:

### 1. Verificar o hostname correto no painel do Supabase

1. Acesse: https://app.supabase.com/
2. Selecione o projeto: **pyranpqcxxbadjjshxax**
3. Vá em **Settings** → **Database**
4. Na seção **Connection string**, copie a URL completa
5. O formato pode ser:
   - `db.xxx.supabase.co` (conexão direta)
   - `xxx.supabase.co` (com connection pooling na porta 6543)

### 2. Usar Connection Pooling (recomendado para aplicações)

O Supabase oferece connection pooling na porta **6543**. Para aplicações Next.js, use:

```
DATABASE_URL=postgresql://postgres:[SENHA]@pyranpqcxxbadjjshxax.supabase.co:6543/postgres?sslmode=require&pgbouncer=true
```

### 3. Para Migrations (Prisma Migrate)

Migrations precisam de conexão direta (porta 5432). Use:

```
DATABASE_URL=postgresql://postgres:[SENHA]@db.pyranpqcxxbadjjshxax.supabase.co:5432/postgres?sslmode=require
```

### 4. Configurar duas URLs (recomendado)

No `prisma/schema.prisma`, você pode usar:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")        // Para queries (pooling)
  directUrl = env("DIRECT_URL")         // Para migrations (direto)
}
```

E no `.env`:

```
# Para aplicação (connection pooling)
DATABASE_URL=postgresql://postgres:[SENHA]@pyranpqcxxbadjjshxax.supabase.co:6543/postgres?sslmode=require&pgbouncer=true

# Para migrations (conexão direta)
DIRECT_URL=postgresql://postgres:[SENHA]@db.pyranpqcxxbadjjshxax.supabase.co:5432/postgres?sslmode=require
```

## Verificar no painel do Supabase

Certifique-se de copiar a **Connection string** exata do painel, que já vem com o formato correto.




