-- CreateTable
CREATE TABLE "Carrinho" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrinhoItem" (
    "id" TEXT NOT NULL,
    "carrinhoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tecidoId" TEXT NOT NULL,
    "variacaoMedida_cm" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "previewPrecoUnit" DECIMAL(10,2),

    CONSTRAINT "CarrinhoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MensagemPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "Role",
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrinho_userId_key" ON "Carrinho"("userId");

-- CreateIndex
CREATE INDEX "CarrinhoItem_carrinhoId_idx" ON "CarrinhoItem"("carrinhoId");

-- CreateIndex
CREATE INDEX "CarrinhoItem_produtoId_variacaoMedida_cm_tecidoId_idx" ON "CarrinhoItem"("produtoId", "variacaoMedida_cm", "tecidoId");

-- CreateIndex
CREATE INDEX "MensagemPedido_pedidoId_createdAt_idx" ON "MensagemPedido"("pedidoId", "createdAt");

-- AddForeignKey
ALTER TABLE "Carrinho" ADD CONSTRAINT "Carrinho_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_carrinhoId_fkey" FOREIGN KEY ("carrinhoId") REFERENCES "Carrinho"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarrinhoItem" ADD CONSTRAINT "CarrinhoItem_tecidoId_fkey" FOREIGN KEY ("tecidoId") REFERENCES "Tecido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemPedido" ADD CONSTRAINT "MensagemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
