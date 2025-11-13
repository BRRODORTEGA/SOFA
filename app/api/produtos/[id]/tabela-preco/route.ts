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

    // Processar cada item individualmente para garantir o constraint correto
    for (const item of json) {
      // Buscar linha existente na tabela geral (tabelaPrecoId: null)
      const linhaExistente = await prisma.tabelaPrecoLinha.findFirst({
        where: {
          produtoId: params.id,
          medida_cm: item.medida_cm,
          tabelaPrecoId: null,
        },
      });

      const dataToUpdate = {
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
      };

      if (linhaExistente) {
        // Atualizar linha existente
        await prisma.tabelaPrecoLinha.update({
          where: { id: linhaExistente.id },
          data: dataToUpdate,
        });
      } else {
        // Criar nova linha
        await prisma.tabelaPrecoLinha.create({
          data: {
            ...dataToUpdate,
            produtoId: params.id,
            medida_cm: item.medida_cm,
            tabelaPrecoId: null, // Tabela geral
          },
        });
      }
    }

    // Sincronizar variações após atualizar tabela de preço
    // Apenas campos de dimensão e metragem (não os preços)
    for (const item of json) {
      try {
        const variacao = await prisma.variacao.findUnique({
          where: {
            produtoId_medida_cm: {
              produtoId: params.id,
              medida_cm: item.medida_cm,
            },
          },
        });

        if (variacao) {
          // Atualizar variação com os dados da tabela de preço
          await prisma.variacao.update({
            where: {
              produtoId_medida_cm: {
                produtoId: params.id,
                medida_cm: item.medida_cm,
              },
            },
            data: {
              largura_cm: item.largura_cm,
              profundidade_cm: item.profundidade_cm,
              altura_cm: item.altura_cm,
              largura_assento_cm: item.largura_assento_cm || 0,
              altura_assento_cm: item.altura_assento_cm || 0,
              largura_braco_cm: item.largura_braco_cm || 0,
              metragem_tecido_m: item.metragem_tecido_m,
              metragem_couro_m: item.metragem_couro_m,
            },
          });
          console.log(`Variação sincronizada para medida ${item.medida_cm}`); // Debug
        }
      } catch (syncError: any) {
        // Log do erro mas não falha a atualização da tabela de preço
        console.warn(`Erro ao sincronizar variação para medida ${item.medida_cm}:`, syncError?.message);
      }
    }

    return ok({ updated: json.length });
  } catch (e: any) {
    console.error("Erro ao salvar tabela de preço:", e);
    return serverError(e?.message || "Erro ao salvar tabela de preço");
  }
}

/** DELETE — exclui linha por medida */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const medida = Number(new URL(req.url).searchParams.get("medida"));
    if (!medida) return unprocessable({ message: "medida obrigatória" });
    
    // Buscar linha na tabela geral (tabelaPrecoId: null) e excluir
    const linha = await prisma.tabelaPrecoLinha.findFirst({
      where: {
        produtoId: params.id,
        medida_cm: medida,
        tabelaPrecoId: null,
      },
    });
    
    if (linha) {
      await prisma.tabelaPrecoLinha.delete({ where: { id: linha.id } });
    }
    
    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    console.error("Erro ao excluir linha de preço:", e);
    return serverError(e?.message || "Erro ao excluir linha de preço");
  }
}

