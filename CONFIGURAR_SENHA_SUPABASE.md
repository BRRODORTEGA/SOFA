# ⚠️ IMPORTANTE: Configurar Senha do Supabase

## O arquivo .env ainda tem a senha como placeholder!

Você precisa substituir `[SENHA_AQUI]` pela senha real do seu banco Supabase.

## Como obter a senha:

### Opção 1: Via Painel do Supabase
1. Acesse: https://app.supabase.com/
2. Selecione o projeto: **pyranpqcxxbadjjshxax**
3. Vá em **Settings** (⚙️) → **Database**
4. Role até a seção **Connection string**
5. Você verá algo como:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@pyranpqcxxbadjjshxax.supabase.co:5432/postgres
   ```
6. Copie a senha que está em `[YOUR-PASSWORD]`

### Opção 2: Resetar a senha
1. No mesmo painel (Settings → Database)
2. Clique em **Reset database password**
3. Copie a nova senha gerada

## Atualizar o .env

Abra o arquivo `.env` e substitua:

**ANTES:**
```
DATABASE_URL=postgresql://postgres:[SENHA_AQUI]@pyranpqcxxbadjjshxax.supabase.co:5432/postgres?sslmode=require
```

**DEPOIS (com a senha real):**
```
DATABASE_URL=postgresql://postgres:SUA_SENHA_REAL_AQUI@pyranpqcxxbadjjshxax.supabase.co:5432/postgres?sslmode=require
```

## Exemplo de senha real:
```
DATABASE_URL=postgresql://postgres:MinhaSenh@123@pyranpqcxxbadjjshxax.supabase.co:5432/postgres?sslmode=require
```

⚠️ **Se a senha tiver caracteres especiais**, pode ser necessário codificar na URL (ex: `@` vira `%40`, `#` vira `%23`)

## Após configurar a senha:

Execute novamente:
```bash
npx prisma migrate dev --name init
```




