-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERADOR', 'FABRICA', 'CLIENTE');

-- CreateEnum
CREATE TYPE "CategoriaGrade" AS ENUM ('G1000', 'G2000', 'G3000', 'G4000', 'G5000', 'G6000', 'G7000', 'COURO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Familia" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "perfilMedidas" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Familia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "abertura" TEXT,
    "acionamento" TEXT,
    "configuracao" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "imagens" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tecido" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "grade" "CategoriaGrade" NOT NULL,
    "imagemUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tecido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProdutoTecido" (
    "produtoId" TEXT NOT NULL,
    "tecidoId" TEXT NOT NULL,

    CONSTRAINT "ProdutoTecido_pkey" PRIMARY KEY ("produtoId","tecidoId")
);

-- CreateTable
CREATE TABLE "Variacao" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "medida_cm" INTEGER NOT NULL,
    "largura_cm" INTEGER NOT NULL,
    "profundidade_cm" INTEGER NOT NULL,
    "altura_cm" INTEGER NOT NULL,
    "metragem_tecido_m" DOUBLE PRECISION NOT NULL,
    "metragem_couro_m" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Variacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TabelaPrecoLinha" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeProduto" TEXT,
    "categoriaTxt" TEXT,
    "familiaTxt" TEXT,
    "tipoTxt" TEXT,
    "aberturaTxt" TEXT,
    "acionamentoTxt" TEXT,
    "medida_cm" INTEGER NOT NULL,
    "largura_cm" INTEGER NOT NULL,
    "profundidade_cm" INTEGER NOT NULL,
    "altura_cm" INTEGER NOT NULL,
    "metragem_tecido_m" DOUBLE PRECISION NOT NULL,
    "metragem_couro_m" DOUBLE PRECISION NOT NULL,
    "preco_grade_1000" DECIMAL(10,2) NOT NULL,
    "preco_grade_2000" DECIMAL(10,2) NOT NULL,
    "preco_grade_3000" DECIMAL(10,2) NOT NULL,
    "preco_grade_4000" DECIMAL(10,2) NOT NULL,
    "preco_grade_5000" DECIMAL(10,2) NOT NULL,
    "preco_grade_6000" DECIMAL(10,2) NOT NULL,
    "preco_grade_7000" DECIMAL(10,2) NOT NULL,
    "preco_couro" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TabelaPrecoLinha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Solicitado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoItem" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tecidoId" TEXT NOT NULL,
    "variacaoMedida_cm" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnit" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PedidoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PedidoStatusHistory" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PedidoStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "providerId" TEXT,
    "status" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Produto_familiaId_categoriaId_idx" ON "Produto"("familiaId", "categoriaId");

-- CreateIndex
CREATE INDEX "Tecido_grade_idx" ON "Tecido"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "Variacao_produtoId_medida_cm_key" ON "Variacao"("produtoId", "medida_cm");

-- CreateIndex
CREATE INDEX "TabelaPrecoLinha_produtoId_medida_cm_idx" ON "TabelaPrecoLinha"("produtoId", "medida_cm");

-- CreateIndex
CREATE UNIQUE INDEX "TabelaPrecoLinha_produtoId_medida_cm_key" ON "TabelaPrecoLinha"("produtoId", "medida_cm");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_codigo_key" ON "Pedido"("codigo");

-- CreateIndex
CREATE INDEX "PedidoStatusHistory_pedidoId_createdAt_idx" ON "PedidoStatusHistory"("pedidoId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Familia" ADD CONSTRAINT "Familia_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoTecido" ADD CONSTRAINT "ProdutoTecido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProdutoTecido" ADD CONSTRAINT "ProdutoTecido_tecidoId_fkey" FOREIGN KEY ("tecidoId") REFERENCES "Tecido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variacao" ADD CONSTRAINT "Variacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TabelaPrecoLinha" ADD CONSTRAINT "TabelaPrecoLinha_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoItem" ADD CONSTRAINT "PedidoItem_tecidoId_fkey" FOREIGN KEY ("tecidoId") REFERENCES "Tecido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PedidoStatusHistory" ADD CONSTRAINT "PedidoStatusHistory_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
