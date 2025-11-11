import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound, serverError } from "@/lib/http";
import { tabelaPrecoLinhaSchema } from "@/lib/validators";
import { Decimal } from "@prisma/client/runtime/library";

/** GET — retorna todas as linhas do produto */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      include: {
        categoria: { select: { nome: true } },
        familia: { select: { nome: true } },
      },
    });
    
    if (!produto) return notFound();
    
    const linhas = await prisma.tabelaPrecoLinha.findMany({
      where: { produtoId: params.id },
      orderBy: { medida_cm: "asc" },
    });
    
    // Enriquecer linhas com dados do produto
    const linhasEnriquecidas = linhas.map(linha => ({
      ...linha,
      categoriaNome: produto.categoria.nome,
      familiaNome: produto.familia.nome,
      produtoNome: produto.nome,
    }));
    
    return ok({ items: linhasEnriquecidas });
  } catch {
    return serverError();
  }
}

/** PUT — salva lista de linhas (autosave / import) */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    if (!Array.isArray(json)) return unprocessable({ message: "Payload deve ser lista" });

    for (const item of json) {
      const parsed = tabelaPrecoLinhaSchema.safeParse(item);
      if (!parsed.success) return unprocessable(parsed.error.flatten());
    }

    await prisma.$transaction(
      json.map((item: any) =>
        prisma.tabelaPrecoLinha.upsert({
          where: { produtoId_medida_cm: { produtoId: params.id, medida_cm: item.medida_cm } },
          update: {
            largura_cm: item.largura_cm,
            profundidade_cm: item.profundidade_cm,
            altura_cm: item.altura_cm,
            largura_assento_cm: item.largura_assento_cm || 0,
            altura_assento_cm: item.altura_assento_cm || 0,
            largura_braco_cm: item.largura_braco_cm || 0,
            metragem_tecido_m: item.metragem_tecido_m,
            metragem_couro_m: item.metragem_couro_m,
            preco_grade_1000: new Decimal(item.preco_grade_1000 || 0),
            preco_grade_2000: new Decimal(item.preco_grade_2000 || 0),
            preco_grade_3000: new Decimal(item.preco_grade_3000 || 0),
            preco_grade_4000: new Decimal(item.preco_grade_4000 || 0),
            preco_grade_5000: new Decimal(item.preco_grade_5000 || 0),
            preco_grade_6000: new Decimal(item.preco_grade_6000 || 0),
            preco_grade_7000: new Decimal(item.preco_grade_7000 || 0),
            preco_couro: new Decimal(item.preco_couro || 0),
          },
          create: {
            medida_cm: item.medida_cm,
            largura_cm: item.largura_cm,
            profundidade_cm: item.profundidade_cm,
            altura_cm: item.altura_cm,
            largura_assento_cm: item.largura_assento_cm || 0,
            altura_assento_cm: item.altura_assento_cm || 0,
            largura_braco_cm: item.largura_braco_cm || 0,
            metragem_tecido_m: item.metragem_tecido_m,
            metragem_couro_m: item.metragem_couro_m,
            produtoId: params.id,
            preco_grade_1000: new Decimal(item.preco_grade_1000 || 0),
            preco_grade_2000: new Decimal(item.preco_grade_2000 || 0),
            preco_grade_3000: new Decimal(item.preco_grade_3000 || 0),
            preco_grade_4000: new Decimal(item.preco_grade_4000 || 0),
            preco_grade_5000: new Decimal(item.preco_grade_5000 || 0),
            preco_grade_6000: new Decimal(item.preco_grade_6000 || 0),
            preco_grade_7000: new Decimal(item.preco_grade_7000 || 0),
            preco_couro: new Decimal(item.preco_couro || 0),
          },
        })
      )
    );

    return ok({ updated: json.length });
  } catch {
    return serverError();
  }
}

/** DELETE — exclui linha por medida */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const medida = Number(new URL(req.url).searchParams.get("medida"));
    if (!medida) return unprocessable({ message: "medida obrigatória" });
    await prisma.tabelaPrecoLinha.delete({ where: { produtoId_medida_cm: { produtoId: params.id, medida_cm: medida } } });
    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError();
  }
}

