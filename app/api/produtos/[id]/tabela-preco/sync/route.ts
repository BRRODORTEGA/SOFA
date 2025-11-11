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
      where: { 
        produtoId: params.id,
        tabelaPrecoId: null, // Apenas linhas da tabela global
      },
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

    // Criar linhas na tabela global (tabelaPrecoId: null)
    let createdCount = 0;
    const medidasCriadas: number[] = [];

    for (const l of linhas) {
      try {
        // Verificar se já existe uma linha para este produto e medida na tabela global
        const linhaExistente = await prisma.tabelaPrecoLinha.findFirst({
          where: {
            produtoId: l.produtoId,
            medida_cm: l.medida_cm,
            tabelaPrecoId: null,
          },
        });

        if (linhaExistente) {
          // Não sobrescrever se já existir
          continue;
        }

        // Criar nova linha na tabela global (tabelaPrecoId: null)
        await prisma.tabelaPrecoLinha.create({
          data: {
            ...l,
            tabelaPrecoId: null, // Tabela global
          },
        });

        createdCount++;
        medidasCriadas.push(l.medida_cm);
      } catch (error: any) {
        // Se for erro de constraint único, a linha já existe (pode ter sido criada por outro processo)
        if (error?.code === "P2002") {
          console.log(`Linha já existe para produto ${l.produtoId}, medida ${l.medida_cm}`);
          continue;
        }
        // Re-lançar outros erros
        throw error;
      }
    }

    return ok({ created: createdCount, medidas: medidasCriadas });
  } catch (e: any) {
    console.error("Erro ao criar skeleton de preços:", e);
    return serverError(e?.message || "Erro ao criar skeleton de preços");
  }
}

