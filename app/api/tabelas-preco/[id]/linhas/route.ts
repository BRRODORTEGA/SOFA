import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound, serverError } from "@/lib/http";
import { tabelaPrecoLinhaSchema } from "@/lib/validators";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

/** GET — retorna todas as linhas de uma tabela de preços específica */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se a tabela existe
    const tabela = await prisma.tabelaPreco.findUnique({
      where: { id: params.id },
    });

    if (!tabela) return notFound();

    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";

    const linhas = await prisma.tabelaPrecoLinha.findMany({
      where: {
        tabelaPrecoId: params.id,
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

    console.log(`GET /api/tabelas-preco/${params.id}/linhas - Retornando ${linhasEnriquecidas.length} linhas`);

    return ok({ items: linhasEnriquecidas, total: linhasEnriquecidas.length });
  } catch (e) {
    console.error("Erro ao buscar linhas da tabela:", e);
    return serverError();
  }
}

/** PUT — salva lista de linhas de uma tabela específica */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se a tabela existe
    const tabela = await prisma.tabelaPreco.findUnique({
      where: { id: params.id },
    });

    if (!tabela) return notFound();

    const json = await req.json();
    const items = Array.isArray(json) ? json : json.items || [];

    if (items.length === 0) {
      return unprocessable({ message: "Lista de linhas vazia" });
    }

    // Função helper para limitar valores Decimal
    const clampDecimal = (value: number | string | Decimal): Decimal => {
      const num = typeof value === "string" ? parseFloat(value) : Number(value);
      if (isNaN(num)) return new Decimal(0);
      const clamped = Math.min(Math.max(num, -99999999.99), 99999999.99);
      return new Decimal(Math.round(clamped * 100) / 100);
    };

    // Agrupar por produtoId para otimizar
    const updatesByProduto = new Map<string, typeof items>();

    for (const item of items) {
      const { produtoId, categoriaNome, familiaNome, produtoNome, ...rest } = item;
      
      if (!produtoId) {
        console.warn("Item sem produtoId ignorado:", item);
        continue;
      }

      if (!updatesByProduto.has(produtoId)) {
        updatesByProduto.set(produtoId, []);
      }
      updatesByProduto.get(produtoId)!.push(item);
    }

    // Processar cada grupo de produto
    let linhasModificadas = false;
    for (const [produtoId, produtoItems] of updatesByProduto) {
      for (const item of produtoItems) {
        const { categoriaNome, familiaNome, produtoNome, ...data } = item;

        const parsed = tabelaPrecoLinhaSchema.safeParse({
          ...data,
          produtoId,
          tabelaPrecoId: params.id,
        });

        if (!parsed.success) {
          console.warn("Validação falhou para item:", item, parsed.error);
          continue;
        }

        const validated = parsed.data;

        // Buscar linha existente para esta tabela específica
        const linhaExistente = await prisma.tabelaPrecoLinha.findFirst({
          where: {
            produtoId,
            medida_cm: validated.medida_cm,
            tabelaPrecoId: params.id,
          },
        });

        if (linhaExistente) {
          await prisma.tabelaPrecoLinha.update({
            where: { id: linhaExistente.id },
            data: {
            largura_cm: validated.largura_cm,
            profundidade_cm: validated.profundidade_cm,
            altura_cm: validated.altura_cm,
            largura_assento_cm: validated.largura_assento_cm,
            altura_assento_cm: validated.altura_assento_cm,
            largura_braco_cm: validated.largura_braco_cm,
            metragem_tecido_m: validated.metragem_tecido_m,
            metragem_couro_m: validated.metragem_couro_m,
            preco_grade_1000: clampDecimal(validated.preco_grade_1000),
            preco_grade_2000: clampDecimal(validated.preco_grade_2000),
            preco_grade_3000: clampDecimal(validated.preco_grade_3000),
            preco_grade_4000: clampDecimal(validated.preco_grade_4000),
            preco_grade_5000: clampDecimal(validated.preco_grade_5000),
            preco_grade_6000: clampDecimal(validated.preco_grade_6000),
            preco_grade_7000: clampDecimal(validated.preco_grade_7000),
            preco_couro: clampDecimal(validated.preco_couro),
            tabelaPrecoId: params.id,
            nomeProduto: produtoNome || undefined,
            categoriaTxt: categoriaNome || undefined,
            familiaTxt: familiaNome || undefined,
            },
          });
          linhasModificadas = true;
        } else {
          await prisma.tabelaPrecoLinha.create({
            data: {
              produtoId,
              tabelaPrecoId: params.id,
              medida_cm: validated.medida_cm,
              largura_cm: validated.largura_cm,
              profundidade_cm: validated.profundidade_cm,
              altura_cm: validated.altura_cm,
              largura_assento_cm: validated.largura_assento_cm,
              altura_assento_cm: validated.altura_assento_cm,
              largura_braco_cm: validated.largura_braco_cm,
              metragem_tecido_m: validated.metragem_tecido_m,
              metragem_couro_m: validated.metragem_couro_m,
              preco_grade_1000: clampDecimal(validated.preco_grade_1000),
              preco_grade_2000: clampDecimal(validated.preco_grade_2000),
              preco_grade_3000: clampDecimal(validated.preco_grade_3000),
              preco_grade_4000: clampDecimal(validated.preco_grade_4000),
              preco_grade_5000: clampDecimal(validated.preco_grade_5000),
              preco_grade_6000: clampDecimal(validated.preco_grade_6000),
              preco_grade_7000: clampDecimal(validated.preco_grade_7000),
              preco_couro: clampDecimal(validated.preco_couro),
              nomeProduto: produtoNome || undefined,
              categoriaTxt: categoriaNome || undefined,
              familiaTxt: familiaNome || undefined,
            },
          });
          linhasModificadas = true;
        }
      }
    }
    
    // Atualizar a data de última atualização da tabela quando linhas são modificadas
    if (linhasModificadas) {
      await prisma.tabelaPreco.update({
        where: { id: params.id },
        data: { updatedAt: new Date() },
      });
    }

    return ok({ saved: true, count: items.length });
  } catch (e: any) {
    console.error("Erro ao salvar linhas da tabela:", e);
    return serverError(e?.message || "Erro ao salvar linhas");
  }
}

/** DELETE — exclui uma linha específica */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const linhaId = url.searchParams.get("linhaId");

    if (!linhaId) {
      return unprocessable({ message: "linhaId obrigatório" });
    }

    // Verificar se a linha pertence à tabela
    const linha = await prisma.tabelaPrecoLinha.findUnique({
      where: { id: linhaId },
    });

    if (!linha || linha.tabelaPrecoId !== params.id) {
      return notFound();
    }

    await prisma.tabelaPrecoLinha.delete({
      where: { id: linhaId },
    });
    
    // Atualizar a data de última atualização da tabela quando linha é excluída
    await prisma.tabelaPreco.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    console.error("Erro ao excluir linha:", e);
    return serverError();
  }
}

