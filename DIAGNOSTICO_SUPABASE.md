# 🔍 Diagnóstico de Conexão Supabase

## Status Atual
- ✅ DNS resolve corretamente (`db.pyranpqcxxbadjjshxax.supabase.co`)
- ❌ Conexão TCP na porta 5432 está falhando

## Possíveis Causas

### 1. Projeto Pausado no Supabase
O Supabase pausa projetos inativos. Verifique:
1. Acesse: https://app.supabase.com/
2. Veja se o projeto `pyranpqcxxbadjjshxax` está **ativo** (não pausado)
3. Se estiver pausado, clique em **Restore** para reativar

### 2. Restrições de IP/Firewall
O Supabase pode ter restrições de IP configuradas:
1. No painel: **Settings** → **Database** → **Connection Pooling**
2. Verifique se há **IP Allowlist** configurada
3. Se houver, adicione seu IP atual ou desabilite temporariamente

### 3. URL de Conexão Incorreta
Use a **Connection string** exata do painel do Supabase:
1. **Settings** → **Database**
2. Na seção **Connection string**, selecione:
   - **URI** (para conexão direta)
   - **Session mode** (para migrations)
3. Copie a URL completa e cole no `.env`

### 4. Formato Correto da URL

O Supabase fornece URLs em dois formatos:

**Para Migrations (conexão direta):**
```
postgresql://postgres:[SENHA]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
```

**Para Aplicação (connection pooling):**
```
postgresql://postgres:[SENHA]@[PROJECT_REF].supabase.co:6543/postgres?sslmode=require&pgbouncer=true
```

## Solução Recomendada

### Passo 1: Verificar Projeto Ativo
Certifique-se de que o projeto não está pausado.

### Passo 2: Copiar URL do Painel
1. Acesse o painel do Supabase
2. **Settings** → **Database**
3. Na seção **Connection string**, selecione **URI** e **Session mode**
4. Copie a URL completa (ela já vem com a senha)

### Passo 3: Atualizar .env
Cole a URL completa no `.env`:

```env
DATABASE_URL=postgresql://postgres.xxxxx:[SENHA]@db.pyranpqcxxbadjjshxax.supabase.co:5432/postgres?sslmode=require
```

**Nota**: O Supabase pode usar `postgres.xxxxx` como usuário (não apenas `postgres`). Use o formato exato do painel.

### Passo 4: Testar Conexão
```bash
npx prisma migrate dev --name init
```

## Alternativa: Usar Prisma Studio para Testar

Se a migração falhar, teste a conexão com:
```bash
npx prisma studio
```

Se o Prisma Studio abrir e conectar, a URL está correta e o problema pode ser específico do migrate.

## Verificar Logs do Supabase

No painel do Supabase:
- **Logs** → **Postgres Logs**
- Verifique se há tentativas de conexão sendo bloqueadas




