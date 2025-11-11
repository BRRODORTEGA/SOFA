import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/http";
import { Decimal } from "@prisma/client/runtime/library";

/** GET: verifica variações faltantes na tabela de preço */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      include: {
        variacoes: {
          select: {
            medida_cm: true,
            largura_cm: true,
            profundidade_cm: true,
            altura_cm: true,
            largura_assento_cm: true,
            altura_assento_cm: true,
            largura_braco_cm: true,
            metragem_tecido_m: true,
            metragem_couro_m: true,
          },
          orderBy: { medida_cm: "asc" },
        },
      },
    });

    if (!produto) return notFound("Produto não encontrado");

    const linhasPreco = await prisma.tabelaPrecoLinha.findMany({
      where: { produtoId: params.id },
      select: { medida_cm: true },
    });

    const medidasComPreco = new Set(linhasPreco.map((l) => l.medida_cm));
    const variacoesFaltantes = produto.variacoes.filter(
      (v) => !medidasComPreco.has(v.medida_cm)
    );

    return ok({
      faltantes: variacoesFaltantes,
      totalVariacoes: produto.variacoes.length,
      totalComPreco: medidasComPreco.size,
    });
  } catch (e) {
    return serverError();
  }
}

/** POST: cria skeleton de preços para variações selecionadas */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const { medidas } = json;

    if (!Array.isArray(medidas) || medidas.length === 0) {
      return ok({ created: 0, message: "Nenhuma medida selecionada" });
    }

    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      include: {
        variacoes: {
          where: {
            medida_cm: { in: medidas },
          },
        },
      },
    });

    if (!produto) return notFound("Produto não encontrado");

    const linhas = produto.variacoes.map((v) => ({
      produtoId: produto.id,
      medida_cm: v.medida_cm,
      largura_cm: v.largura_cm,
      profundidade_cm: v.profundidade_cm,
      altura_cm: v.altura_cm,
      largura_assento_cm: v.largura_assento_cm || 0,
      altura_assento_cm: v.altura_assento_cm || 0,
      largura_braco_cm: v.largura_braco_cm || 0,
      metragem_tecido_m: v.metragem_tecido_m,
      metragem_couro_m: v.metragem_couro_m,
      nomeProduto: produto.nome,
      categoriaTxt: null,
      familiaTxt: null,
      tipoTxt: produto.tipo,
      aberturaTxt: produto.abertura,
      acionamentoTxt: produto.acionamento,
      preco_grade_1000: new Decimal(0),
      preco_grade_2000: new Decimal(0),
      preco_grade_3000: new Decimal(0),
      preco_grade_4000: new Decimal(0),
      preco_grade_5000: new Decimal(0),
      preco_grade_6000: new Decimal(0),
      preco_grade_7000: new Decimal(0),
      preco_couro: new Decimal(0),
    }));

    // Upsert por (produtoId, medida_cm)
    for (const l of linhas) {
      await prisma.tabelaPrecoLinha.upsert({
        where: { produtoId_medida_cm: { produtoId: l.produtoId, medida_cm: l.medida_cm } },
        update: {}, // não sobrescrever se já existir
        create: l,
      });
    }

    return ok({ created: linhas.length, medidas: linhas.map((l) => l.medida_cm) });
  } catch (e) {
    return serverError();
  }
}

