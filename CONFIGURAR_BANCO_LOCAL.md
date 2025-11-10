# 🗄️ Configurar Banco de Dados Local

## ✅ Arquivo .env Criado

O arquivo `.env` foi configurado para usar o PostgreSQL local:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_sofa
```

## ⚠️ Próximos Passos

### 1. Atualizar a Senha no .env

**IMPORTANTE**: Edite o arquivo `.env` e substitua `postgres` (a senha) pela senha real que você definiu ao instalar o PostgreSQL.

Exemplo:
```env
DATABASE_URL=postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/ai_sofa
```

### 2. Verificar se o PostgreSQL está rodando

No PowerShell, execute:

```powershell
# Verificar se o serviço está rodando
Get-Service -Name postgresql*

# Se não estiver rodando, inicie:
Start-Service -Name postgresql-x64-*  # Ajuste o nome conforme sua instalação
```

### 3. Criar o Banco de Dados (se ainda não existir)

```powershell
# Conectar ao PostgreSQL
psql -U postgres

# Dentro do psql, criar o banco:
CREATE DATABASE ai_sofa;

# Sair
\q
```

Ou use o script automatizado:

```powershell
.\setup-local-db.ps1
```

### 4. Executar as Migrações

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 5. Testar a Conexão

```bash
npx prisma studio
```

## 🔍 Verificar Conexão

Se houver erros de conexão:

1. **Verifique se o PostgreSQL está rodando:**
   ```powershell
   Get-Service postgresql*
   ```

2. **Teste a conexão manualmente:**
   ```powershell
   psql -U postgres -h localhost -d ai_sofa
   ```

3. **Verifique a porta (padrão é 5432):**
   ```powershell
   netstat -an | findstr 5432
   ```

## ✅ Pronto!

Após configurar a senha e criar o banco, você pode executar as migrações e começar a usar o sistema.


