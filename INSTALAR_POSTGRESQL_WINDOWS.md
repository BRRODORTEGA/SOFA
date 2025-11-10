# 🐘 Instalar PostgreSQL no Windows

## Opção 1: Instalação via Instalador (Recomendado)

### Passo 1: Download

1. Acesse: https://www.postgresql.org/download/windows/
2. Clique em **"Download the installer"**
3. Baixe o instalador (ex: `postgresql-16.x-windows-x64.exe`)

### Passo 2: Instalação

1. Execute o instalador
2. **Next** → **Next**
3. Escolha o diretório de instalação (padrão: `C:\Program Files\PostgreSQL\16`)
4. **Next**
5. Selecione componentes:
   - ✅ PostgreSQL Server
   - ✅ pgAdmin 4 (interface gráfica - opcional mas útil)
   - ✅ Command Line Tools
   - ✅ Stack Builder (opcional)
6. **Next**
7. Escolha o diretório de dados (padrão: `C:\Program Files\PostgreSQL\16\data`)
8. **Next**
9. **Defina a senha do usuário `postgres`** (anote essa senha!)
   - Exemplo: `postgres123` (ou uma senha mais segura)
10. **Next**
11. Porta: mantenha `5432` (padrão)
12. **Next**
13. Locale: mantenha `[Default locale]`
14. **Next**
15. **Next** (confirmação)
16. **Next** (preparação)
17. Aguarde a instalação
18. **Finish**

### Passo 3: Verificar Instalação

Abra um novo PowerShell e execute:

```powershell
psql --version
```

Se mostrar a versão, está instalado!

## Opção 2: Instalação via Chocolatey (Mais Rápido)

Se você tem Chocolatey instalado:

```powershell
choco install postgresql16
```

## Opção 3: Instalação via Winget (Windows 11/10)

```powershell
winget install PostgreSQL.PostgreSQL
```

## 🔧 Configurar Banco de Dados

Após instalar, execute os comandos abaixo:

### 1. Adicionar PostgreSQL ao PATH (se necessário)

O instalador geralmente adiciona automaticamente, mas se `psql` não funcionar:

1. Abra **Variáveis de Ambiente**
2. Edite **Path** do usuário
3. Adicione: `C:\Program Files\PostgreSQL\16\bin`
4. Reinicie o PowerShell

### 2. Criar Banco de Dados

Execute no PowerShell:

```powershell
# Conectar ao PostgreSQL (use a senha que definiu na instalação)
psql -U postgres

# Dentro do psql, execute:
CREATE DATABASE ai_sofa;
\q
```

Ou em uma linha:

```powershell
$env:PGPASSWORD='sua_senha'; psql -U postgres -c "CREATE DATABASE ai_sofa;"
```

### 3. Atualizar .env

Atualize o arquivo `.env` com:

```env
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/ai_sofa
```

Substitua `SUA_SENHA` pela senha que você definiu na instalação.

### 4. Executar Migrações

```bash
npx prisma migrate dev --name init
```

## 🚀 Script Automatizado

Crie um arquivo `setup-local-db.ps1` (fornecido abaixo) para automatizar a criação do banco.

## ✅ Verificar se Está Funcionando

```bash
# Testar conexão
npx prisma studio
```

Se abrir o Prisma Studio, está tudo funcionando!

## 🔍 Troubleshooting

### Erro: "psql não é reconhecido"
- Adicione PostgreSQL ao PATH
- Reinicie o PowerShell

### Erro: "password authentication failed"
- Verifique a senha no `.env`
- Teste conectar manualmente: `psql -U postgres`

### Erro: "database does not exist"
- Crie o banco: `CREATE DATABASE ai_sofa;`

### Serviço não está rodando
```powershell
# Iniciar serviço
Start-Service postgresql-x64-16
```



