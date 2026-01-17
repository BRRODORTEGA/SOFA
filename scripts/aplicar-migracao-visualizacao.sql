-- Migração para adicionar campo de rastreamento de visualização de pedidos
-- Execute este SQL diretamente no banco de dados PostgreSQL

ALTER TABLE "Pedido" ADD COLUMN IF NOT EXISTS "ultimaVisualizacaoCliente" TIMESTAMP(3);


