import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound, serverError } from "@/lib/http";
import { variacoesGenerateSchema } from "@/lib/validators";
import { Decimal } from "@prisma/client/runtime/library";

type PerfilMedidas = {
  medidas?: number[];
  dimensoes?: Record<string, { largura?: number; profundidade?: number; altura?: number }>;
  metragem?: {
    tecido?: Record<string, number>;
    couro?: Record<string, number>;
  };
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const parsed = variacoesGenerateSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());

    const { medidasFixas, medidasCustom, usarPerfilFamilia, criarSkeletonPreco } = parsed.data;
    const medidasSolicitadas = Array.from(new Set([...medidasFixas, ...medidasCustom])).sort((a, b) => a - b);

    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      include: {
        familia: true,
        variacoes: true,
      },
    });
    if (!produto) return notFound("Produto não encontrado");

    const existentes = new Set(produto.variacoes.map(v => v.medida_cm));
    const aCriar = medidasSolicitadas.filter(m => !existentes.has(m));
    if (aCriar.length === 0) return ok({ created: 0, skipped: medidasSolicitadas.length });

    // Tentar perfil da família
    let perfil: PerfilMedidas | null = null;
    if (usarPerfilFamilia && produto.familia?.perfilMedidas) {
      try { perfil = produto.familia.perfilMedidas as any; } catch { perfil = null; }
    }

    const toCreate = aCriar.map((medida) => {
      const key = String(medida);
      const largura = perfil?.dimensoes?.[key]?.largura ?? 0;
      const profundidade = perfil?.dimensoes?.[key]?.profundidade ?? 0;
      const altura = perfil?.dimensoes?.[key]?.altura ?? 0;
      const metragemT = perfil?.metragem?.tecido?.[key] ?? 0.0;
      const metragemC = perfil?.metragem?.couro?.[key] ?? 0.0;

      return {
        produtoId: produto.id,
        medida_cm: medida,
        largura_cm: largura,
        profundidade_cm: profundidade,
        altura_cm: altura,
        metragem_tecido_m: metragemT,
        metragem_couro_m: metragemC,
      };
    });

    // Cria variações
    await prisma.$transaction([
      prisma.variacao.createMany({ data: toCreate, skipDuplicates: true }),
    ]);

    // Opcional: criar/garantir skeleton de preços
    if (criarSkeletonPreco) {
      const linhas = toCreate.map(v => ({
        produtoId: v.produtoId,
        medida_cm: v.medida_cm,
        largura_cm: v.largura_cm,
        profundidade_cm: v.profundidade_cm,
        altura_cm: v.altura_cm,
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

      // upsert por (produtoId, medida_cm)
      for (const l of linhas) {
        await prisma.tabelaPrecoLinha.upsert({
          where: { produtoId_medida_cm: { produtoId: l.produtoId, medida_cm: l.medida_cm } },
          update: {}, // não sobrescrever se já existir; edição virá na Fase 6
          create: l,
        });
      }
    }

    return ok({ created: toCreate.length, medidas: aCriar });
  } catch (e) {
    return serverError();
  }
}

