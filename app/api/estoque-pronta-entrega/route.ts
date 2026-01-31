import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";

/** Lista todas as células de estoque (produto × medida × tecido) com quantidade */
export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      where: {},
      select: {
        id: true,
        nome: true,
        categoriaId: true,
        categoria: { select: { id: true, nome: true } },
        familiaId: true,
        familia: { select: { id: true, nome: true } },
        variacoes: { select: { id: true, medida_cm: true } },
        tecidos: { select: { tecidoId: true, tecido: { select: { id: true, nome: true } } } },
      },
      orderBy: { nome: "asc" },
    });

    const estoqueMap = await prisma.estoqueProntaEntrega.findMany().then((rows) =>
      new Map(rows.map((r) => [`${r.variacaoId}:${r.tecidoId}`, r.quantidade]))
    );

    const items: {
      produtoId: string;
      produtoNome: string;
      categoriaId: string;
      categoriaNome: string;
      familiaId: string;
      familiaNome: string;
      variacaoId: string;
      medida_cm: number;
      tecidoId: string;
      tecidoNome: string;
      quantidade: number;
    }[] = [];

    for (const p of produtos) {
      const categoriaNome = p.categoria?.nome ?? "Sem categoria";
      const familiaNome = p.familia?.nome ?? "Sem família";
      const categoriaId = p.categoria?.id ?? `cat-${p.categoriaId}`;
      const familiaId = p.familia?.id ?? `fam-${p.familiaId}`;
      for (const v of p.variacoes) {
        for (const pt of p.tecidos) {
          const key = `${v.id}:${pt.tecidoId}`;
          const quantidade = estoqueMap.get(key) ?? 0;
          items.push({
            produtoId: p.id,
            produtoNome: p.nome,
            categoriaId,
            categoriaNome,
            familiaId,
            familiaNome,
            variacaoId: v.id,
            medida_cm: v.medida_cm,
            tecidoId: pt.tecidoId,
            tecidoNome: pt.tecido.nome,
            quantidade,
          });
        }
      }
    }

    return ok({ items });
  } catch (e: any) {
    console.error("GET estoque-pronta-entrega:", e);
    return serverError(e?.message || "Erro ao listar estoque");
  }
}

/** Atualiza a quantidade de uma célula (variacao + tecido). Valida que o tecido pertence ao produto da variação. */
export async function PATCH(req: Request) {
  try {
    const json = await req.json();
    const variacaoId = json?.variacaoId;
    const tecidoId = json?.tecidoId;
    let quantidade = json?.quantidade;
    if (variacaoId == null || tecidoId == null) {
      return unprocessable("variacaoId e tecidoId são obrigatórios.");
    }
    quantidade = Math.max(0, Number(quantidade) || 0);
    if (!Number.isInteger(quantidade)) {
      return unprocessable("quantidade deve ser um número inteiro não negativo.");
    }

    const variacao = await prisma.variacao.findUnique({
      where: { id: variacaoId },
      select: { produtoId: true },
    });
    if (!variacao) {
      return unprocessable("Variação não encontrada.");
    }

    const produtoTecido = await prisma.produtoTecido.findUnique({
      where: { produtoId_tecidoId: { produtoId: variacao.produtoId, tecidoId } },
    });
    if (!produtoTecido) {
      return unprocessable("Este tecido não está vinculado ao produto desta variação.");
    }

    const row = await prisma.estoqueProntaEntrega.upsert({
      where: {
        variacaoId_tecidoId: { variacaoId, tecidoId },
      },
      create: { variacaoId, tecidoId, quantidade },
      update: { quantidade },
    });
    return ok(row);
  } catch (e: any) {
    console.error("PATCH estoque-pronta-entrega:", e);
    return serverError(e?.message || "Erro ao atualizar estoque");
  }
}
