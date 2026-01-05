-- Adicionar coluna descontoPercentual na tabela TabelaPrecoLinha
ALTER TABLE "TabelaPrecoLinha" ADD COLUMN IF NOT EXISTS "descontoPercentual" DECIMAL(5,2);

