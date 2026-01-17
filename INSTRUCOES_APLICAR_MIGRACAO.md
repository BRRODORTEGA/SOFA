# Instruções para Aplicar Migração - Campo possuiLados

## Problema
O Prisma Client precisa ser regenerado após adicionar o campo `possuiLados` ao schema. O erro mostra que o cliente não reconhece o campo.

## Solução

### 1. Aplicar a migração SQL no banco de dados

Execute o seguinte SQL diretamente no seu banco PostgreSQL:

```sql
-- Adicionar campo possuiLados ao modelo Produto
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "possuiLados" BOOLEAN NOT NULL DEFAULT false;

-- Atualizar todos os produtos existentes para false (não possui lados)
UPDATE "Produto" SET "possuiLados" = false WHERE "possuiLados" IS NULL;
```

Ou execute o arquivo `scripts/aplicar-migracao-possui-lados.sql`.

### 2. Regenerar o Prisma Client

Após aplicar a migração SQL, execute:

```bash
npx prisma generate
```

**Nota:** Se houver erro de permissão (EPERM), feche o servidor Next.js e tente novamente.

### 3. Reiniciar o servidor Next.js

Após regenerar o Prisma Client, reinicie o servidor:

```bash
npm run dev
```

## Verificação

Após seguir os passos acima, tente editar um produto e selecionar "Possui Lados" (Sim ou Não). O campo deve ser salvo corretamente.

