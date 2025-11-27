# Solução de Problemas - Conexão com Banco de Dados

## ✅ Status Atual

A verificação mostra que:
- ✅ PostgreSQL está rodando (versão 18.0)
- ✅ Banco de dados `ai_sofa` existe e está acessível
- ✅ Todas as 19 tabelas estão criadas
- ✅ Conexão está funcionando corretamente

## 🔧 Soluções para Erros de Conexão

### 1. Erro: "Cannot connect to database"

**Solução:**
```powershell
# Verificar se o PostgreSQL está rodando
Get-Service | Where-Object Name -like "*postgres*"

# Se não estiver rodando, iniciar:
Start-Service postgresql-x64-18
```

### 2. Erro: "EPERM: operation not permitted" ao gerar Prisma Client

**Causa:** O servidor Next.js está usando os arquivos do Prisma Client.

**Solução:**
1. Pare o servidor Next.js (Ctrl+C no terminal onde está rodando)
2. Execute:
```powershell
npx prisma generate
```
3. Reinicie o servidor:
```powershell
npm run dev
```

### 3. Erro: "Database does not exist"

**Solução:**
```powershell
# Conectar ao PostgreSQL (ajuste o caminho se necessário)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres

# Dentro do psql, criar o banco:
CREATE DATABASE ai_sofa;

# Sair do psql:
\q
```

### 4. Verificar conexão manualmente

Execute o script de verificação:
```powershell
npx tsx scripts/verificar-banco.ts
```

### 5. Verificar arquivo .env

Certifique-se de que o arquivo `.env` contém:
```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ai_sofa?schema=public"
```

Substitua:
- `usuario`: seu usuário PostgreSQL (geralmente `postgres`)
- `senha`: sua senha PostgreSQL

### 6. Reiniciar tudo

Se nada funcionar, tente:
```powershell
# 1. Parar o servidor Next.js
# 2. Parar o PostgreSQL
Stop-Service postgresql-x64-18

# 3. Iniciar o PostgreSQL
Start-Service postgresql-x64-18

# 4. Regenerar Prisma Client
npx prisma generate

# 5. Sincronizar schema (se necessário)
npx prisma db push

# 6. Reiniciar o servidor Next.js
npm run dev
```

## 📊 Verificação Rápida

Para verificar rapidamente se tudo está OK:
```powershell
npx tsx scripts/verificar-banco.ts
```

Este script verifica:
- ✅ Conexão com o banco
- ✅ Versão do PostgreSQL
- ✅ Tabelas existentes
- ✅ Contagem de registros

## 🆘 Se o problema persistir

1. Verifique os logs do PostgreSQL em:
   - `C:\Program Files\PostgreSQL\18\data\log\`

2. Verifique se a porta 5432 está livre:
   ```powershell
   netstat -an | findstr 5432
   ```

3. Verifique firewall do Windows:
   - Certifique-se de que a porta 5432 está liberada

4. Verifique permissões:
   - Certifique-se de que o usuário tem permissão para acessar o banco `ai_sofa`

