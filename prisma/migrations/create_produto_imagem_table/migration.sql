-- Criar tabela ProdutoImagem
CREATE TABLE IF NOT EXISTS "ProdutoImagem" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tecidoId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'complementar',
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProdutoImagem_pkey" PRIMARY KEY ("id")
);

-- Criar índices
CREATE INDEX IF NOT EXISTS "ProdutoImagem_produtoId_idx" ON "ProdutoImagem"("produtoId");
CREATE INDEX IF NOT EXISTS "ProdutoImagem_tecidoId_idx" ON "ProdutoImagem"("tecidoId");
CREATE INDEX IF NOT EXISTS "ProdutoImagem_produtoId_tecidoId_idx" ON "ProdutoImagem"("produtoId", "tecidoId");

-- Adicionar foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ProdutoImagem_produtoId_fkey'
    ) THEN
        ALTER TABLE "ProdutoImagem" ADD CONSTRAINT "ProdutoImagem_produtoId_fkey" 
        FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ProdutoImagem_tecidoId_fkey'
    ) THEN
        ALTER TABLE "ProdutoImagem" ADD CONSTRAINT "ProdutoImagem_tecidoId_fkey" 
        FOREIGN KEY ("tecidoId") REFERENCES "Tecido"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

