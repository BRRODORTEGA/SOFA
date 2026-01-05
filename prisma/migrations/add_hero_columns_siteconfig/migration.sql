-- Adicionar todas as colunas do Hero/Banner na tabela SiteConfig
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroTipo" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroTitulo" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroSubtitulo" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroBotaoTexto" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroBotaoLink" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroImagemUrl" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroImagemLink" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroImagemObjectFit" TEXT;
ALTER TABLE "SiteConfig" ADD COLUMN IF NOT EXISTS "heroImagemObjectPosition" TEXT;

