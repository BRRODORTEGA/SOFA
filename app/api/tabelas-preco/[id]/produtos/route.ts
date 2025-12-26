import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/http";

/**
 * GET - Retorna produtos únicos de uma tabela de preço específica
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const tabelaPreco = await prisma.tabelaPreco.findUnique({
      where: { id: params.id },
    });

    if (!tabelaPreco) {
      return notFound("Tabela de preço não encontrada");
    }

    // Buscar linhas da tabela e obter produtos únicos
    const linhas = await prisma.tabelaPrecoLinha.findMany({
      where: {
        tabelaPrecoId: params.id,
      },
      select: {
        produtoId: true,
        produto: {
          select: {
            id: true,
            nome: true,
            status: true,
            categoria: {
              select: {
                id: true,
                nome: true,
              },
            },
            familia: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
      distinct: ["produtoId"],
    });

    // Filtrar apenas produtos ativos e mapear
    const produtos = linhas
      .filter((linha) => linha.produto.status)
      .map((linha) => ({
        id: linha.produto.id,
        nome: linha.produto.nome,
        categoria: linha.produto.categoria,
        familia: linha.produto.familia,
      }));

    return ok({ produtos });
  } catch (error) {
    console.error("Erro ao buscar produtos da tabela:", error);
    return serverError();
  }
}


