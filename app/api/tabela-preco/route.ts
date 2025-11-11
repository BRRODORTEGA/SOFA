import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";
import { tabelaPrecoLinhaSchema } from "@/lib/validators";
import { Decimal } from "@prisma/client/runtime/library";

/** GET — retorna todas as linhas de preço de todos os produtos */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    
    const linhas = await prisma.tabelaPrecoLinha.findMany({
      where: {
        tabelaPrecoId: null, // Apenas linhas da tabela geral (não vinculadas a tabelas específicas)
      },
      include: {
        produto: {
          include: {
            categoria: { select: { nome: true } },
            familia: { select: { nome: true } },
          },
        },
      },
      orderBy: [
        { produto: { categoria: { nome: "asc" } } },
        { produto: { familia: { nome: "asc" } } },
        { produto: { nome: "asc" } },
        { medida_cm: "asc" },
      ],
    });

    // Filtrar por busca se necessário
    let linhasFiltradas = linhas;
    if (q) {
      const qLower = q.toLowerCase();
      linhasFiltradas = linhas.filter(
        (l) =>
          l.produto.categoria.nome.toLowerCase().includes(qLower) ||
          l.produto.familia.nome.toLowerCase().includes(qLower) ||
          l.produto.nome.toLowerCase().includes(qLower) ||
          String(l.medida_cm).includes(q)
      );
    }

    // Enriquecer linhas com dados do produto
    const linhasEnriquecidas = linhasFiltradas.map((linha) => ({
      id: linha.id,
      produtoId: linha.produtoId,
      categoriaNome: linha.produto.categoria.nome,
      familiaNome: linha.produto.familia.nome,
      produtoNome: linha.produto.nome,
      medida_cm: linha.medida_cm,
      largura_cm: linha.largura_cm,
      profundidade_cm: linha.profundidade_cm,
      altura_cm: linha.altura_cm,
      largura_assento_cm: linha.largura_assento_cm,
      altura_assento_cm: linha.altura_assento_cm,
      largura_braco_cm: linha.largura_braco_cm,
      metragem_tecido_m: linha.metragem_tecido_m,
      metragem_couro_m: linha.metragem_couro_m,
      preco_grade_1000: linha.preco_grade_1000,
      preco_grade_2000: linha.preco_grade_2000,
      preco_grade_3000: linha.preco_grade_3000,
      preco_grade_4000: linha.preco_grade_4000,
      preco_grade_5000: linha.preco_grade_5000,
      preco_grade_6000: linha.preco_grade_6000,
      preco_grade_7000: linha.preco_grade_7000,
      preco_couro: linha.preco_couro,
    }));

    return ok({ items: linhasEnriquecidas, total: linhasEnriquecidas.length });
  } catch (e) {
    return serverError();
  }
}

/** PUT — salva lista de linhas (autosave / import) */
export async function PUT(req: Request) {
  try {
    const json = await req.json();
    if (!Array.isArray(json)) return unprocessable({ message: "Payload deve ser lista" });

    // Agrupar por produtoId para otimizar
    const porProduto = new Map<string, any[]>();
    for (const item of json) {
      if (!item.produtoId) {
        return unprocessable({ message: "produtoId é obrigatório em cada linha" });
      }
      if (!porProduto.has(item.produtoId)) {
        porProduto.set(item.produtoId, []);
      }
      porProduto.get(item.produtoId)!.push(item);
    }

    // Validar cada item
    for (const item of json) {
      const parsed = tabelaPrecoLinhaSchema.safeParse(item);
      if (!parsed.success) return unprocessable(parsed.error.flatten());
    }

    // Buscar todos os produtos de uma vez para otimizar
    const produtoIds = Array.from(porProduto.keys());
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtoIds } },
      select: { id: true, nome: true, tipo: true, abertura: true, acionamento: true },
    });
    const produtosMap = new Map(produtos.map((p) => [p.id, p]));

    // Atualizar ou criar por produto (upsert)
    const results = [];
    for (const [produtoId, items] of porProduto.entries()) {
      const produto = produtosMap.get(produtoId);
      
      for (const item of items) {
        const { medida_cm, produtoId: _, categoriaNome, familiaNome, produtoNome, ...rest } = item;

        // Função helper para validar e limitar valores Decimal(10, 2)
        // Máximo: 99.999.999,99 (10^8 - 0.01)
        const maxDecimalValue = 99999999.99;
        const clampDecimal = (value: number): number => {
          const num = Number(value) || 0;
          if (num > maxDecimalValue) return maxDecimalValue;
          if (num < -maxDecimalValue) return -maxDecimalValue;
          // Arredondar para 2 casas decimais
          return Math.round(num * 100) / 100;
        };

        const dataToSave = {
          produtoId,
          medida_cm,
          largura_cm: rest.largura_cm,
          profundidade_cm: rest.profundidade_cm,
          altura_cm: rest.altura_cm,
          largura_assento_cm: rest.largura_assento_cm || 0,
          altura_assento_cm: rest.altura_assento_cm || 0,
          largura_braco_cm: rest.largura_braco_cm || 0,
          metragem_tecido_m: rest.metragem_tecido_m,
          metragem_couro_m: rest.metragem_couro_m,
          preco_grade_1000: new Decimal(clampDecimal(rest.preco_grade_1000 || 0)),
          preco_grade_2000: new Decimal(clampDecimal(rest.preco_grade_2000 || 0)),
          preco_grade_3000: new Decimal(clampDecimal(rest.preco_grade_3000 || 0)),
          preco_grade_4000: new Decimal(clampDecimal(rest.preco_grade_4000 || 0)),
          preco_grade_5000: new Decimal(clampDecimal(rest.preco_grade_5000 || 0)),
          preco_grade_6000: new Decimal(clampDecimal(rest.preco_grade_6000 || 0)),
          preco_grade_7000: new Decimal(clampDecimal(rest.preco_grade_7000 || 0)),
          preco_couro: new Decimal(clampDecimal(rest.preco_couro || 0)),
          nomeProduto: produto?.nome || null,
          tipoTxt: produto?.tipo || null,
          aberturaTxt: produto?.abertura || null,
          acionamentoTxt: produto?.acionamento || null,
        };

        const updated = await prisma.tabelaPrecoLinha.upsert({
          where: { produtoId_medida_cm: { produtoId, medida_cm } },
          update: dataToSave,
          create: dataToSave,
        });
        results.push(updated);
      }
    }

    return ok({ updated: results.length });
  } catch (e: any) {
    if (e?.code === "P2025") return unprocessable({ message: "Uma ou mais linhas não existem" });
    return serverError(e?.message || "Erro interno do servidor");
  }
}

