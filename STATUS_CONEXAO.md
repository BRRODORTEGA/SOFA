# 🔴 Status da Conexão com Supabase

## ❌ Problema Confirmado

O teste de conexão falhou com o erro:
```
Can't reach database server at `db.pyranpqcxxbadjjshxax.supabase.co:5432`
```

## ✅ URL Configurada Corretamente

A URL no `.env` está no formato correto:
```
DATABASE_URL=postgresql://postgres:kZqjhHNCng1fYUUd@db.pyranpqcxxbadjjshxax.supabase.co:5432/postgres?sslmode=require
```

## 🔍 Causa Provável

O projeto Supabase está **pausado** ou **inativo**. O Supabase pausa projetos gratuitos após 7 dias de inatividade.

## 🛠️ Solução

### 1. Verificar Status do Projeto

1. Acesse: https://app.supabase.com/
2. Faça login na sua conta
3. Localize o projeto: `pyranpqcxxbadjjshxax`
4. Verifique o status:
   - ✅ **Ativo** (verde) → Projeto está rodando
   - ⏸️ **Pausado** (cinza) → Precisa restaurar

### 2. Restaurar Projeto (se pausado)

Se o projeto estiver pausado:

1. Clique no projeto
2. Clique em **"Restore"** ou **"Resume"**
3. Aguarde 2-5 minutos para o banco ficar disponível
4. O status mudará para **"Active"**

### 3. Verificar Connection String

Após restaurar:

1. **Settings** → **Database**
2. Na seção **Connection string**:
   - Selecione **URI**
   - Selecione **Session mode**
3. Copie a URL completa
4. Compare com a URL no `.env`
5. Se diferente, atualize o `.env`

### 4. Testar Novamente

Após restaurar o projeto, execute:

```bash
# Teste de conexão
npx tsx test-db-connection.ts

# Ou migração
npx prisma migrate dev --name init
```

## 🔄 Alternativas

### Opção 1: Criar Novo Projeto

Se o projeto atual não puder ser restaurado:

1. Crie um novo projeto no Supabase
2. Copie a nova Connection string
3. Atualize o `.env` com a nova URL
4. Execute as migrações

### Opção 2: Usar PostgreSQL Local (Temporário)

Para desenvolvimento local enquanto resolve o Supabase:

1. Instale PostgreSQL localmente
2. Crie um banco de dados
3. Atualize `DATABASE_URL` no `.env`:
   ```
   DATABASE_URL=postgresql://postgres:senha@localhost:5432/nome_do_banco
   ```
4. Execute as migrações

## 📝 Próximos Passos

1. ✅ Verificar status do projeto no painel
2. ✅ Restaurar se pausado
3. ✅ Aguardar alguns minutos
4. ✅ Testar conexão novamente
5. ✅ Executar migrações

## ⚠️ Nota Importante

O Supabase Free Tier tem limitações:
- Projetos pausam após 7 dias de inatividade
- Pode levar alguns minutos para restaurar
- Alguns recursos podem ter limites de uso




