-- AlterTable
ALTER TABLE "TabelaPrecoLinha" ADD COLUMN     "altura_assento_cm" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "largura_assento_cm" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "largura_braco_cm" INTEGER NOT NULL DEFAULT 0;
