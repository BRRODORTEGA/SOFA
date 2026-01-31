import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, serverError, paginateParams } from "@/lib/http";
import { ambienteSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { limit, offset, q } = paginateParams(url.searchParams);
    const ativoOnly = url.searchParams.get("ativo") === "true";
    const comProdutosTabelaVigente = url.searchParams.get("comProdutosTabelaVigente") === "true";
    const comProdutosProntaEntrega = url.searchParams.get("comProdutosProntaEntrega") === "true";

    const where: any = q ? { nome: { contains: q, mode: "insensitive" as const } } : {};
    if (ativoOnly) where.ativo = true;

    // Para filtro na loja: apenas ambientes que têm pelo menos um produto na tabela vigente do site
    if (comProdutosTabelaVigente && !comProdutosProntaEntrega) {
      const siteConfig = await prisma.siteConfig.findUnique({
        where: { id: "site-config" },
        select: {
          tabelaPrecoVigenteId: true,
          produtosAtivosTabelaVigente: true,
        },
      });
      const produtosAtivos = (siteConfig?.produtosAtivosTabelaVigente as string[] | null) || [];
      if (siteConfig?.tabelaPrecoVigenteId && produtosAtivos.length > 0) {
        where.produtos = { some: { id: { in: produtosAtivos } } };
      } else {
        // Sem tabela vigente ou lista vazia: ambientes que têm pelo menos um produto ativo
        where.produtos = { some: { status: true } };
      }
    }

    // Apenas ambientes que têm pelo menos um produto com estoque pronta entrega
    if (comProdutosProntaEntrega) {
      const estoquePE = await prisma.estoqueProntaEntrega.findMany({
        where: { quantidade: { gt: 0 } },
        select: { variacao: { select: { produtoId: true } } },
      });
      const produtoIdsPE = [...new Set(estoquePE.map((e) => e.variacao.produtoId))];
      if (produtoIdsPE.length > 0) {
        where.produtos = { some: { id: { in: produtoIdsPE } } };
      } else {
        where.produtos = { some: { id: { in: [] } } };
      }
    }

    const [items, total] = await Promise.all([
      prisma.ambiente.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { nome: "asc" },
      }),
      prisma.ambiente.count({ where }),
    ]);
    return ok({ items, total, limit, offset });
  } catch (e) {
    return serverError();
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = ambienteSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());
    const createdItem = await prisma.ambiente.create({ data: parsed.data });
    return created(createdItem);
  } catch (e) {
    return serverError();
  }
}
