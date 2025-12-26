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
        descontoPercentual: true,
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
        descontoPercentual: true,
      },
    });
  }

  if (!linha) return null;

  // Obter o preço baseado na grade do tecido
  let precoBase: number;
  switch (tecido.grade) {
    case "G1000":
      precoBase = Number(linha.preco_grade_1000);
      break;
    case "G2000":
      precoBase = Number(linha.preco_grade_2000);
      break;
    case "G3000":
      precoBase = Number(linha.preco_grade_3000);
      break;
    case "G4000":
      precoBase = Number(linha.preco_grade_4000);
      break;
    case "G5000":
      precoBase = Number(linha.preco_grade_5000);
      break;
    case "G6000":
      precoBase = Number(linha.preco_grade_6000);
      break;
    case "G7000":
      precoBase = Number(linha.preco_grade_7000);
      break;
    case "COURO":
      precoBase = Number(linha.preco_couro);
      break;
    default:
      return null;
  }

  return precoBase;
}

/**
 * Retorna o desconto percentual da linha de preço, se houver
 */
export async function getDescontoPercentualLinha(
  produtoId: string,
  medida_cm: number
): Promise<number | null> {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: { acionamento: true },
  });
  if (!produto) return null;

  const acionamentoTxt = produto.acionamento || null;

  const siteConfig = await prisma.siteConfig.findUnique({
    where: { id: "site-config" },
    select: { tabelaPrecoVigenteId: true },
  });

  const tabelaPrecoId = siteConfig?.tabelaPrecoVigenteId || null;

  let linha = null;

  if (tabelaPrecoId) {
    linha = await prisma.tabelaPrecoLinha.findFirst({
      where: {
        produtoId,
        medida_cm,
        tabelaPrecoId: tabelaPrecoId,
        acionamentoTxt: acionamentoTxt,
      },
      select: {
        descontoPercentual: true,
      },
    });
  }

  if (!linha) {
    linha = await prisma.tabelaPrecoLinha.findFirst({
      where: {
        produtoId,
        medida_cm,
        tabelaPrecoId: null,
        acionamentoTxt: acionamentoTxt,
      },
      select: {
        descontoPercentual: true,
      },
    });
  }

  if (!linha || !linha.descontoPercentual) return null;

  return Number(linha.descontoPercentual);
}

/**
 * Retorna o desconto máximo de um produto (entre todas as linhas e medidas)
 */
export async function getDescontoMaximoProduto(
  produtoId: string
): Promise<number | null> {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: { acionamento: true },
  });
  if (!produto) return null;

  const acionamentoTxt = produto.acionamento || null;

  const siteConfig = await prisma.siteConfig.findUnique({
    where: { id: "site-config" },
    select: { tabelaPrecoVigenteId: true },
  });

  const tabelaPrecoId = siteConfig?.tabelaPrecoVigenteId || null;

  const where: any = {
    produtoId,
    acionamentoTxt: acionamentoTxt,
  };

  if (tabelaPrecoId) {
    where.tabelaPrecoId = tabelaPrecoId;
  } else {
    where.tabelaPrecoId = null;
  }

  const linhas = await prisma.tabelaPrecoLinha.findMany({
    where,
    select: {
      descontoPercentual: true,
    },
    take: 100, // Limitar para performance
  });

  if (linhas.length === 0) return null;

  // Encontrar o maior desconto entre todas as linhas
  let descontoMaximo = 0;
  for (const linha of linhas) {
    if (linha.descontoPercentual) {
      const desconto = Number(linha.descontoPercentual);
      if (desconto > descontoMaximo) {
        descontoMaximo = desconto;
      }
    }
  }

  return descontoMaximo > 0 ? descontoMaximo : null;
}

/**
 * Retorna o preço mínimo e desconto máximo de um produto
 */
export async function getPrecoMinimoEDescontoProduto(
  produtoId: string
): Promise<{ preco: number | null; desconto: number | null }> {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: { acionamento: true },
  });
  if (!produto) return { preco: null, desconto: null };

  const acionamentoTxt = produto.acionamento || null;

  const siteConfig = await prisma.siteConfig.findUnique({
    where: { id: "site-config" },
    select: { tabelaPrecoVigenteId: true },
  });

  const tabelaPrecoId = siteConfig?.tabelaPrecoVigenteId || null;

  const where: any = {
    produtoId,
    acionamentoTxt: acionamentoTxt,
  };

  if (tabelaPrecoId) {
    where.tabelaPrecoId = tabelaPrecoId;
  } else {
    where.tabelaPrecoId = null;
  }

  const linhas = await prisma.tabelaPrecoLinha.findMany({
    where,
    select: {
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
    take: 50, // Limitar para performance
  });

  if (linhas.length === 0) return { preco: null, desconto: null };

  // Encontrar o menor preço e maior desconto
  let precoMinimo = Infinity;
  let descontoMaximo = 0;

  for (const linha of linhas) {
    const precos = [
      Number(linha.preco_grade_1000),
      Number(linha.preco_grade_2000),
      Number(linha.preco_grade_3000),
      Number(linha.preco_grade_4000),
      Number(linha.preco_grade_5000),
      Number(linha.preco_grade_6000),
      Number(linha.preco_grade_7000),
      Number(linha.preco_couro),
    ];
    const menorPrecoLinha = Math.min(...precos.filter(p => p > 0));
    if (menorPrecoLinha < precoMinimo) {
      precoMinimo = menorPrecoLinha;
    }

    if (linha.descontoPercentual) {
      const desconto = Number(linha.descontoPercentual);
      if (desconto > descontoMaximo) {
        descontoMaximo = desconto;
      }
    }
  }

  return {
    preco: precoMinimo === Infinity ? null : precoMinimo,
    desconto: descontoMaximo > 0 ? descontoMaximo : null,
  };
}

