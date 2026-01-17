-- Adicionar colunas de cupom na tabela Pedido
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "cupomCodigo" TEXT;
ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "descontoCupom" DECIMAL(10,2);

-- Adicionar foreign key para Cupom se ainda não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Pedido_cupomCodigo_fkey'
    ) THEN
        ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cupomCodigo_fkey" 
        FOREIGN KEY ("cupomCodigo") REFERENCES "Cupom"("codigo") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;



