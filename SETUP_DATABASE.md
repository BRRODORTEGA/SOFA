# Configuração do Banco de Dados

## Problema: "Can't reach database server at localhost:5432"

Este erro indica que o PostgreSQL não está rodando ou não está acessível.

## Solução 1: Iniciar o PostgreSQL (Windows)

### Opção A: Via Gerenciador de Serviços
1. Pressione `Win + R`
2. Digite `services.msc` e pressione Enter
3. Procure por um serviço chamado:
   - `postgresql-x64-XX` (onde XX é a versão)
   - `PostgreSQL`
4. Clique com botão direito → **Iniciar**

### Opção B: Via PowerShell (como Administrador)
```powershell
# Listar serviços do PostgreSQL
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Iniciar o serviço (substitua pelo nome real)
Start-Service postgresql-x64-15
# ou
Start-Service postgresql-x64-16
```

### Opção C: Via linha de comando do PostgreSQL
Se você instalou o PostgreSQL, pode iniciar manualmente:
```powershell
# Navegue até a pasta bin do PostgreSQL (ajuste o caminho)
cd "C:\Program Files\PostgreSQL\15\bin"
.\pg_ctl.exe -D "C:\Program Files\PostgreSQL\15\data" start
```

## Solução 2: Verificar e Ajustar o arquivo .env

1. Abra o arquivo `.env` na raiz do projeto
2. Verifique a linha `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/room2go
   ```
3. Ajuste conforme sua instalação:
   - **usuario**: geralmente `postgres` ou seu usuário
   - **senha**: a senha que você definiu na instalação
   - **porta**: geralmente `5432` (padrão)
   - **room2go**: nome do banco de dados

## Solução 3: Criar o Banco de Dados

Se o PostgreSQL estiver rodando mas o banco não existir:

1. Abra o **pgAdmin** ou use o `psql`:
   ```powershell
   psql -U postgres
   ```

2. Crie o banco:
   ```sql
   CREATE DATABASE room2go;
   ```

3. Ou via linha de comando:
   ```powershell
   psql -U postgres -c "CREATE DATABASE room2go;"
   ```

## Solução 4: Executar Migrações

Após o banco estar criado e o PostgreSQL rodando:

```bash
# Gerar o cliente Prisma
npx prisma generate

# Criar as tabelas
npx prisma migrate dev --name init
```

## Verificar se está funcionando

Teste a conexão:
```powershell
psql -U postgres -h localhost -p 5432 -d room2go
```

Se conectar sem erro, está tudo certo!

## Alternativa: Usar SQLite para desenvolvimento (não recomendado para produção)

Se não conseguir configurar o PostgreSQL agora, você pode temporariamente usar SQLite:

1. No `prisma/schema.prisma`, altere:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. No `.env`, comente a linha `DATABASE_URL` ou remova

3. Execute:
   ```bash
   npx prisma migrate dev --name init
   ```

**Nota**: SQLite tem limitações e não é recomendado para produção. Use apenas para desenvolvimento/teste.




