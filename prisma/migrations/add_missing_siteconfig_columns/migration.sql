-- Adicionar colunas faltantes na tabela SiteConfig
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "produtosAtivosTabelaVigente" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "ordemCategorias" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "configuracoesExtras" JSONB;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "tabelaPrecoVigenteId" TEXT;


