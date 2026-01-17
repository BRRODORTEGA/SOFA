-- Adicionar TODAS as colunas faltantes na tabela SiteConfig de uma vez
-- Colunas do Hero/Banner
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroTipo" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroTitulo" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroSubtitulo" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroBotaoTexto" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroBotaoLink" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroImagemUrl" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroImagemLink" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroImagemObjectFit" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroImagemObjectPosition" TEXT;

-- Logo da empresa
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;

-- Configurações de Filtros
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtrosAtivos" BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtrosTitulo" BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtrosAplicados" BOOLEAN DEFAULT true;

-- Configuração do filtro de categoria
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtroCategoriaAtivo" BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtroCategoriaNome" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtroCategoriaCategorias" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Configuração do filtro de preço
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtroPrecoAtivo" BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtroPrecoNome" TEXT;

-- Configuração do filtro de opções de produto
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtroOpcoesProdutoAtivo" BOOLEAN DEFAULT true;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "filtroOpcoesProdutoNome" TEXT;



