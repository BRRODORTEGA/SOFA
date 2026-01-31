import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/http";

/**
 * GET /api/produtos/[id]/pronta-entrega-opcoes
 * Retorna as combinações (tecidoId, medida_cm) que possuem estoque pronta entrega > 0 para o produto.
 * Usado na página do produto quando o cliente vem da seção "Pronta Entrega" para filtrar os dropdowns.
 */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!produto) return notFound();

    const registros = await prisma.estoqueProntaEntrega.findMany({
      where: {
        quantidade: { gt: 0 },
        variacao: { produtoId: params.id },
      },
      select: {
        tecidoId: true,
        variacao: { select: { medida_cm: true } },
      },
    });

    // Garantir que o tecido está vinculado ao produto (ProdutoTecido)
    const produtoTecidos = await prisma.produtoTecido.findMany({
      where: { produtoId: params.id },
      select: { tecidoId: true },
    });
    const tecidoIdsDoProduto = new Set(produtoTecidos.map((pt) => pt.tecidoId));

    const combinacoes = registros
      .filter((r) => tecidoIdsDoProduto.has(r.tecidoId))
      .map((r) => ({ tecidoId: r.tecidoId, medida_cm: r.variacao.medida_cm }));

    // Remover duplicatas (mesmo tecido+medida)
    const unicos = Array.from(
      new Map(combinacoes.map((c) => [`${c.tecidoId}-${c.medida_cm}`, c])).values()
    );

    return ok({ combinacoes: unicos });
  } catch (e) {
    console.error("[pronta-entrega-opcoes]", e);
    return serverError();
  }
}
