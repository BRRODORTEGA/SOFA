# ⚡ Setup Rápido - PostgreSQL Local

## 1. Instalar PostgreSQL

### Opção A: Download Manual
1. Acesse: https://www.postgresql.org/download/windows/
2. Baixe e instale (defina uma senha para o usuário `postgres`)

### Opção B: Via Winget (Windows 11/10)
```powershell
winget install PostgreSQL.PostgreSQL
```

## 2. Criar Banco de Dados

Execute no PowerShell:

```powershell
# Conectar (use a senha que definiu)
psql -U postgres

# Dentro do psql:
CREATE DATABASE ai_sofa;
\q
```

## 3. Configurar .env

Edite o arquivo `.env` e atualize:

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/ai_sofa
```

## 4. Executar Migrações

```bash
npx prisma migrate dev --name init
```

## ✅ Pronto!

Consulte `INSTALAR_POSTGRESQL_WINDOWS.md` para instruções detalhadas.



