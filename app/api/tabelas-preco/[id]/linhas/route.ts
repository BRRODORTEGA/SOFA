import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound, serverError } from "@/lib/http";
import { tabelaPrecoLinhaSchema } from "@/lib/validators";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

// Função para garantir que a coluna desconto_percentual existe
async function ensureDescontoColumnExists() {
  try {
    // Verificar se a coluna existe usando informação do schema
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'TabelaPrecoLinha' 
       AND column_name = 'descontoPercentual'`
    );
    
    if (result.length === 0) {
      // Criar a coluna se não existir (PostgreSQL não suporta IF NOT EXISTS em ADD COLUMN, então usamos DO)
      await prisma.$executeRawUnsafe(
        `DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'TabelaPrecoLinha' 
            AND column_name = 'descontoPercentual'
          ) THEN
            ALTER TABLE "TabelaPrecoLinha" ADD COLUMN "descontoPercentual" DECIMAL(5,2);
          END IF;
        END $$;`
      );
      console.log("Coluna desconto_percentual criada com sucesso");
    }
  } catch (e: any) {
    // Se der erro, logar mas não falhar (pode ser que já exista)
    console.log("Erro ao verificar/criar coluna desconto_percentual:", e?.message);
  }
}

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
      descontoPercentual: linha.descontoPercentual,
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
    // Garantir que a coluna desconto_percentual existe
    await ensureDescontoColumnExists();

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

        // Preparar descontoPercentual
        const descontoPercentual = validated.descontoPercentual !== undefined && validated.descontoPercentual !== null
          ? clampDecimal(validated.descontoPercentual)
          : null;

        if (linhaExistente) {
          // Usar $executeRaw para atualizar incluindo descontoPercentual se necessário
          // Isso funciona mesmo se o Prisma Client não foi regenerado
          const updateFields: string[] = [];
          const updateValues: any[] = [];
          let paramIndex = 1;

          updateFields.push(`largura_cm = $${paramIndex++}`);
          updateValues.push(validated.largura_cm);
          updateFields.push(`profundidade_cm = $${paramIndex++}`);
          updateValues.push(validated.profundidade_cm);
          updateFields.push(`altura_cm = $${paramIndex++}`);
          updateValues.push(validated.altura_cm);
          updateFields.push(`largura_assento_cm = $${paramIndex++}`);
          updateValues.push(validated.largura_assento_cm);
          updateFields.push(`altura_assento_cm = $${paramIndex++}`);
          updateValues.push(validated.altura_assento_cm);
          updateFields.push(`largura_braco_cm = $${paramIndex++}`);
          updateValues.push(validated.largura_braco_cm);
          updateFields.push(`metragem_tecido_m = $${paramIndex++}`);
          updateValues.push(validated.metragem_tecido_m);
          updateFields.push(`metragem_couro_m = $${paramIndex++}`);
          updateValues.push(validated.metragem_couro_m);
          updateFields.push(`preco_grade_1000 = $${paramIndex++}`);
          updateValues.push(Number(clampDecimal(validated.preco_grade_1000)));
          updateFields.push(`preco_grade_2000 = $${paramIndex++}`);
          updateValues.push(Number(clampDecimal(validated.preco_grade_2000)));
          updateFields.push(`preco_grade_3000 = $${paramIndex++}`);
          updateValues.push(Number(clampDecimal(validated.preco_grade_3000)));
          updateFields.push(`preco_grade_4000 = $${paramIndex++}`);
          updateValues.push(Number(clampDecimal(validated.preco_grade_4000)));
          updateFields.push(`preco_grade_5000 = $${paramIndex++}`);
          updateValues.push(Number(clampDecimal(validated.preco_grade_5000)));
          updateFields.push(`preco_grade_6000 = $${paramIndex++}`);
          updateValues.push(Number(clampDecimal(validated.preco_grade_6000)));
          updateFields.push(`preco_grade_7000 = $${paramIndex++}`);
          updateValues.push(Number(clampDecimal(validated.preco_grade_7000)));
          updateFields.push(`preco_couro = $${paramIndex++}`);
          updateValues.push(Number(clampDecimal(validated.preco_couro)));
          
          if (descontoPercentual !== null) {
            updateFields.push(`"descontoPercentual" = $${paramIndex++}`);
            updateValues.push(Number(descontoPercentual));
          } else {
            updateFields.push(`"descontoPercentual" = NULL`);
          }

          if (produtoNome) {
            updateFields.push(`"nomeProduto" = $${paramIndex++}`);
            updateValues.push(produtoNome);
          }
          if (categoriaNome) {
            updateFields.push(`"categoriaTxt" = $${paramIndex++}`);
            updateValues.push(categoriaNome);
          }
          if (familiaNome) {
            updateFields.push(`"familiaTxt" = $${paramIndex++}`);
            updateValues.push(familiaNome);
          }

          updateFields.push(`"tabelaPrecoId" = $${paramIndex++}`);
          updateValues.push(params.id);
          updateFields.push(`"updatedAt" = NOW()`);

          const sql = `UPDATE "TabelaPrecoLinha" SET ${updateFields.join(", ")} WHERE id = $${paramIndex}`;
          updateValues.push(linhaExistente.id);

          await prisma.$executeRawUnsafe(sql, ...updateValues);
          linhasModificadas = true;
        } else {
          // Para criação, usar Prisma normal mas sem descontoPercentual se não estiver disponível
          const createData: any = {
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
          };

          // Tentar adicionar descontoPercentual, mas não falhar se não existir
          try {
            if (descontoPercentual !== null) {
              createData.descontoPercentual = descontoPercentual;
            }
            await prisma.tabelaPrecoLinha.create({ data: createData });
          } catch (e: any) {
            // Se falhar por causa do descontoPercentual, criar sem ele e depois atualizar via SQL
            if (e.message?.includes("descontoPercentual") || e.message?.includes("desconto_percentual")) {
              delete createData.descontoPercentual;
              const created = await prisma.tabelaPrecoLinha.create({ data: createData });
              if (descontoPercentual !== null) {
                await prisma.$executeRawUnsafe(
                  `UPDATE "TabelaPrecoLinha" SET "descontoPercentual" = $1 WHERE id = $2`,
                  Number(descontoPercentual),
                  created.id
                );
              }
            } else {
              throw e;
            }
          }
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

