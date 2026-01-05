-- CreateTable
CREATE TABLE "TabelaPreco" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TabelaPreco_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TabelaPreco_ativo_idx" ON "TabelaPreco"("ativo");

-- AlterTable
ALTER TABLE "TabelaPrecoLinha" ADD COLUMN "tabelaPrecoId" TEXT;

-- CreateIndex
CREATE INDEX "TabelaPrecoLinha_tabelaPrecoId_idx" ON "TabelaPrecoLinha"("tabelaPrecoId");

-- AddForeignKey
ALTER TABLE "TabelaPrecoLinha" ADD CONSTRAINT "TabelaPrecoLinha_tabelaPrecoId_fkey" FOREIGN KEY ("tabelaPrecoId") REFERENCES "TabelaPreco"("id") ON DELETE SET NULL ON UPDATE CASCADE;
