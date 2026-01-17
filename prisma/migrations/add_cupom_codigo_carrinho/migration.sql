-- Adicionar coluna cupomCodigo na tabela Carrinho
ALTER TABLE "Carrinho" ADD COLUMN IF NOT EXISTS "cupomCodigo" TEXT;
ALTER TABLE "Carrinho" ADD COLUMN IF NOT EXISTS "descontoCupom" DECIMAL(10,2);

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



