import { prisma } from "./prisma";

const GRADES = [
  "preco_grade_1000",
  "preco_grade_2000",
  "preco_grade_3000",
  "preco_grade_4000",
  "preco_grade_5000",
  "preco_grade_6000",
  "preco_grade_7000",
  "preco_couro",
] as const;

export type PrecoDesconto = { preco: number | null; desconto: number | null };

/**
 * Busca preço mínimo e desconto máximo de vários produtos em 1–2 consultas,
 * evitando N+1 na página inicial.
 */
export async function getPrecosMinimosEmLote(
  produtoIds: string[],
  tabelaPrecoId: string | null
): Promise<Map<string, PrecoDesconto>> {
  const map = new Map<string, PrecoDesconto>();
  const uniq = [...new Set(produtoIds)];
  if (uniq.length === 0) return map;

  const where: any = { produtoId: { in: uniq } };
  if (tabelaPrecoId) {
    where.OR = [{ tabelaPrecoId }, { tabelaPrecoId: null }];
  } else {
    where.tabelaPrecoId = null;
  }

  const linhas = await prisma.tabelaPrecoLinha.findMany({
    where,
    select: {
      produtoId: true,
      preco_grade_1000: true,
      preco_grade_2000: true,
      preco_grade_3000: true,
      preco_grade_4000: true,
      preco_grade_5000: true,
      preco_grade_6000: true,
      preco_grade_7000: true,
      preco_couro: true,
      descontoPercentual: true,
    },
  });

  for (const produtoId of uniq) {
    const linhasProduto = linhas.filter((l) => l.produtoId === produtoId);
    let precoMinimo: number | null = null;
    let descontoMaximo: number | null = null;

    for (const linha of linhasProduto) {
      const precos = GRADES.map((k) => Number((linha as any)[k])).filter((p) => p > 0);
      if (precos.length > 0) {
        const min = Math.min(...precos);
        if (precoMinimo === null || min < precoMinimo) precoMinimo = min;
      }
      if (linha.descontoPercentual != null) {
        const d = Number(linha.descontoPercentual);
        if (descontoMaximo === null || d > descontoMaximo) descontoMaximo = d;
      }
    }
    map.set(produtoId, {
      preco: precoMinimo,
      desconto: descontoMaximo ?? null,
    });
  }
  return map;
}
