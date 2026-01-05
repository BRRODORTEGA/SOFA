-- Criar tabela Cupom se não existir
CREATE TABLE IF NOT EXISTS "Cupom" (
    "codigo" TEXT NOT NULL,
    "descricao" TEXT,
    "descontoPercentual" DECIMAL(5,2),
    "descontoFixo" DECIMAL(10,2),
    "valorMinimo" DECIMAL(10,2),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "limiteUsos" INTEGER,
    "usosAtuais" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cupom_pkey" PRIMARY KEY ("codigo")
);

-- Adicionar coluna cupomCodigo na tabela Carrinho se não existir
ALTER TABLE "Carrinho" ADD COLUMN IF NOT EXISTS "cupomCodigo" TEXT;

-- Adicionar foreign key para Cupom se ainda não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Carrinho_cupomCodigo_fkey'
    ) THEN
        ALTER TABLE "Carrinho" ADD CONSTRAINT "Carrinho_cupomCodigo_fkey" 
        FOREIGN KEY ("cupomCodigo") REFERENCES "Cupom"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

