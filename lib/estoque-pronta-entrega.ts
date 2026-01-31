import { prisma } from "./prisma";

/**
 * Retorna a quantidade em estoque pronta entrega para (produto + medida + tecido).
 * Retorna null se não houver registro.
 */
export async function getEstoqueProntaEntrega(
  produtoId: string,
  medida_cm: number,
  tecidoId: string
): Promise<number | null> {
  const variacao = await prisma.variacao.findUnique({
    where: {
      produtoId_medida_cm: { produtoId, medida_cm },
    },
    select: { id: true },
  });
  if (!variacao) return null;

  const estoque = await prisma.estoqueProntaEntrega.findUnique({
    where: {
      variacaoId_tecidoId: { variacaoId: variacao.id, tecidoId },
    },
    select: { quantidade: true },
  });
  return estoque ? estoque.quantidade : null;
}

/**
 * Abate quantidade do estoque pronta entrega para (produto + medida + tecido).
 * Só atualiza se houver registro; a quantidade não fica negativa (mínimo 0).
 */
export async function abaterEstoqueProntaEntrega(
  produtoId: string,
  medida_cm: number,
  tecidoId: string,
  quantidadeAbater: number
): Promise<void> {
  if (quantidadeAbater <= 0) return;

  const variacao = await prisma.variacao.findUnique({
    where: {
      produtoId_medida_cm: { produtoId, medida_cm },
    },
    select: { id: true },
  });
  if (!variacao) return;

  const estoque = await prisma.estoqueProntaEntrega.findUnique({
    where: {
      variacaoId_tecidoId: { variacaoId: variacao.id, tecidoId },
    },
    select: { id: true, quantidade: true },
  });
  if (!estoque) return;

  const novaQuantidade = Math.max(0, estoque.quantidade - quantidadeAbater);
  await prisma.estoqueProntaEntrega.update({
    where: { id: estoque.id },
    data: { quantidade: novaQuantidade },
  });
}
