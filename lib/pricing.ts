import { prisma } from "./prisma";

/**
 * Dado produto + medida + tecido, retorna o preço correto olhando a grade do tecido
 * e a coluna equivalente na TabelaPrecoLinha (1000..7000/Couro). Lança erro se faltar dado.
 */
export async function getPrecoUnitario(produtoId: string, medida_cm: number, tecidoId: string) {
  const tecido = await prisma.tecido.findUnique({ where: { id: tecidoId }, select: { grade: true } });
  if (!tecido) throw new Error("Tecido não encontrado");

  const linha = await prisma.tabelaPrecoLinha.findUnique({
    where: { produtoId_medida_cm: { produtoId, medida_cm } },
    select: {
      preco_grade_1000: true,
      preco_grade_2000: true,
      preco_grade_3000: true,
      preco_grade_4000: true,
      preco_grade_5000: true,
      preco_grade_6000: true,
      preco_grade_7000: true,
      preco_couro: true,
    },
  });
  if (!linha) throw new Error("Linha de preço não encontrada para a medida");

  switch (tecido.grade) {
    case "G1000":
      return Number(linha.preco_grade_1000);
    case "G2000":
      return Number(linha.preco_grade_2000);
    case "G3000":
      return Number(linha.preco_grade_3000);
    case "G4000":
      return Number(linha.preco_grade_4000);
    case "G5000":
      return Number(linha.preco_grade_5000);
    case "G6000":
      return Number(linha.preco_grade_6000);
    case "G7000":
      return Number(linha.preco_grade_7000);
    case "COURO":
      return Number(linha.preco_couro);
    default:
      throw new Error("Grade de tecido inválida");
  }
}

