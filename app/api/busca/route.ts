import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";
import { getPrecoMinimoEDescontoProduto } from "@/lib/pricing";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q) {
      return ok({
        produtos: [],
        categorias: [],
        familias: [],
        total: 0,
      });
    }

    // Buscar configurações do site para verificar tabela vigente
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        tabelaPrecoVigenteId: true,
        produtosAtivosTabelaVigente: true,
        descontosProdutosDestaque: true,
      },
    }) as any;

    // Preparar filtro de produtos ativos
    const produtosAtivosFilter: any = { status: true };
    if (siteConfig?.tabelaPrecoVigenteId) {
      const produtosAtivos = siteConfig.produtosAtivosTabelaVigente || [];
      if (produtosAtivos.length > 0) {
        produtosAtivosFilter.id = { in: produtosAtivos };
      } else {
        produtosAtivosFilter.id = { in: [] };
      }
    }

    // Buscar produtos
    const produtosRaw = await prisma.produto.findMany({
      where: {
        ...produtosAtivosFilter,
        nome: { contains: q, mode: "insensitive" },
      },
      include: {
        categoria: { select: { id: true, nome: true } },
        familia: { select: { id: true, nome: true } },
      },
      take: 20,
      orderBy: { nome: "asc" },
    });

    // Enriquecer produtos com preços e descontos
    const descontos = (siteConfig?.descontosProdutosDestaque as Record<string, number>) || {};
    const tabelaPrecoVigenteId = siteConfig?.tabelaPrecoVigenteId || null;

    const produtos = await Promise.all(
      produtosRaw.map(async (produto) => {
        const descontoProdutoDestaque = descontos[produto.id] || 0;
        const { preco: precoOriginal, desconto: descontoLinha } = await getPrecoMinimoEDescontoProduto(produto.id);
        
        // Usar o maior desconto entre linha da tabela e produto em destaque
        const descontoPercentual = Math.max(descontoProdutoDestaque, descontoLinha || 0);
        
        const precoComDesconto = precoOriginal && descontoPercentual > 0
          ? precoOriginal * (1 - descontoPercentual / 100)
          : precoOriginal;

        return {
          ...produto,
          precoOriginal,
          precoComDesconto,
          descontoPercentual: descontoPercentual > 0 ? descontoPercentual : undefined,
        };
      })
    );

    // Buscar categorias
    const categorias = await prisma.categoria.findMany({
      where: {
        ativo: true,
        nome: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        nome: true,
      },
      take: 10,
      orderBy: { nome: "asc" },
    });

    // Buscar famílias
    const familias = await prisma.familia.findMany({
      where: {
        ativo: true,
        nome: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        nome: true,
      },
      take: 10,
      orderBy: { nome: "asc" },
    });

    return ok({
      produtos,
      categorias,
      familias,
      total: produtos.length + categorias.length + familias.length,
    });
  } catch (error: any) {
    console.error("Erro ao buscar:", error);
    return serverError(error?.message || "Erro ao realizar busca");
  }
}
