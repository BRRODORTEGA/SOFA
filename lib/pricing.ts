import { prisma } from "./prisma";

/**
 * Dado produto + medida + tecido, retorna o preço correto olhando a grade do tecido
 * e a coluna equivalente na TabelaPrecoLinha (1000..7000/Couro).
 * Usa a tabela de preço vigente configurada no SiteConfig.
 * Retorna null se não encontrar o preço.
 */
export async function getPrecoUnitario(
  produtoId: string,
  medida_cm: number,
  tecidoId: string
): Promise<number | null> {
  // Buscar tecido para obter a grade
  const tecido = await prisma.tecido.findUnique({ where: { id: tecidoId }, select: { grade: true } });
  if (!tecido) return null;

  // Buscar produto para obter o acionamento (necessário para a busca de preço)
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: { acionamento: true },
  });
  if (!produto) return null;

  const acionamentoTxt = produto.acionamento || null;

  // Buscar a tabela de preço vigente do SiteConfig
  const siteConfig = await prisma.siteConfig.findUnique({
    where: { id: "site-config" },
    select: { tabelaPrecoVigenteId: true },
  });

  const tabelaPrecoId = siteConfig?.tabelaPrecoVigenteId || null;

  // Buscar a linha de preço considerando a tabela de preço vigente e acionamento
  // Primeiro tenta com a tabela específica, depois sem tabela (NULL)
  let linha = null;

  if (tabelaPrecoId) {
    // Buscar linha na tabela de preço vigente
    linha = await prisma.tabelaPrecoLinha.findFirst({
      where: {
        produtoId,
        medida_cm,
        tabelaPrecoId: tabelaPrecoId,
        acionamentoTxt: acionamentoTxt,
      },
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
  }

  // Se não encontrou na tabela específica, busca sem tabela (linhas gerais)
  if (!linha) {
    linha = await prisma.tabelaPrecoLinha.findFirst({
      where: {
        produtoId,
        medida_cm,
        tabelaPrecoId: null,
        acionamentoTxt: acionamentoTxt,
      },
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
  }

  if (!linha) return null;

  // Retornar o preço baseado na grade do tecido
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
      return null;
  }
}

