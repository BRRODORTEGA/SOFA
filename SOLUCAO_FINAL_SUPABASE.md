# 🔧 Solução Final: Conexão Supabase

## Diagnóstico

O DNS está resolvendo, mas a conexão TCP falha. Possíveis causas:

1. **Projeto pausado no Supabase** (mais provável)
2. **Restrições de IP/Firewall**
3. **URL incorreta** (formato ou credenciais)

## ✅ Solução Passo a Passo

### 1. Verificar Projeto Ativo

**CRÍTICO**: O Supabase pausa projetos inativos após 7 dias.

1. Acesse: https://app.supabase.com/
2. Verifique se o projeto `pyranpqcxxbadjjshxax` está **ATIVO**
3. Se estiver **pausado**, clique em **"Restore"** ou **"Resume"**
4. Aguarde alguns minutos para o banco ficar disponível

### 2. Obter Connection String Correta

No painel do Supabase:

1. **Settings** → **Database**
2. Role até a seção **Connection string**
3. Selecione:
   - **URI** (não "JDBC" ou outros)
   - **Session mode** (não "Transaction mode")
4. **Copie a URL completa** - ela já vem com:
   - Usuário correto (pode ser `postgres.xxxxx`)
   - Senha
   - Hostname correto
   - Parâmetros SSL

### 3. Atualizar .env

Cole a URL **EXATA** copiada do painel no arquivo `.env`:

```env
DATABASE_URL=postgresql://postgres.xxxxx:[SENHA]@db.pyranpqcxxbadjjshxax.supabase.co:5432/postgres?sslmode=require
```

**⚠️ IMPORTANTE**: Use a URL exata do painel, não tente construir manualmente!

### 4. Verificar Restrições de IP (Opcional)

Se ainda não funcionar:

1. **Settings** → **Database** → **Connection Pooling**
2. Verifique se há **IP Allowlist** configurada
3. Se houver, adicione seu IP público ou desabilite temporariamente

Para descobrir seu IP público:
- Acesse: https://whatismyipaddress.com/
- Copie o IP e adicione na allowlist do Supabase

### 5. Executar Migração

Após configurar:

```bash
npx prisma migrate dev --name init
```

## 🔍 Verificação Alternativa

Se a migração ainda falhar, teste a conexão com Prisma Studio:

```bash
npx prisma studio
```

Se o Prisma Studio abrir e conectar, a URL está correta e o problema pode ser específico do migrate.

## 📝 Formato Esperado da URL

A URL do Supabase geralmente tem este formato:

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
```

Onde:
- `[PROJECT_REF]` = `pyranpqcxxbadjjshxax`
- `[PASSWORD]` = senha do banco (obtida no painel)

## ⚠️ Problemas Comuns

### "Can't reach database server"
- ✅ Projeto está pausado → Restaure no painel
- ✅ Firewall bloqueando → Verifique allowlist
- ✅ URL incorreta → Copie do painel

### "Authentication failed"
- ✅ Senha incorreta → Reset no painel
- ✅ Usuário incorreto → Use o formato do painel

### "SSL required"
- ✅ Adicione `?sslmode=require` na URL

## 🆘 Se Nada Funcionar

1. **Reset a senha do banco** no painel do Supabase
2. **Copie a nova Connection string** completa
3. **Cole no .env** substituindo a antiga
4. **Tente novamente** a migração




