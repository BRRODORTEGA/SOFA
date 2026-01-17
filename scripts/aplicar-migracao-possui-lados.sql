-- Migração para adicionar campo possuiLados ao modelo Produto
-- Execute este SQL diretamente no banco de dados PostgreSQL

-- Adicionar campo possuiLados ao modelo Produto
ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "possuiLados" BOOLEAN NOT NULL DEFAULT false;

-- Atualizar todos os produtos existentes para false (não possui lados)
UPDATE "Produto" SET "possuiLados" = false WHERE "possuiLados" IS NULL;

