-- Migração para adicionar campo 'lado' ao modelo CarrinhoItem
-- Este campo é usado para produtos que possuem lados (esquerdo ou direito)

-- Adicionar campo lado ao CarrinhoItem
ALTER TABLE "CarrinhoItem" ADD COLUMN IF NOT EXISTS "lado" TEXT;

-- Remover índice antigo se existir
DROP INDEX IF EXISTS "CarrinhoItem_produtoId_variacaoMedida_cm_tecidoId_idx";

-- Criar novo índice incluindo o campo lado
CREATE INDEX IF NOT EXISTS "CarrinhoItem_produtoId_variacaoMedida_cm_tecidoId_lado_idx" 
ON "CarrinhoItem"("produtoId", "variacaoMedida_cm", "tecidoId", "lado");
