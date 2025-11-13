import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound, serverError } from "@/lib/http";
import { Decimal } from "@prisma/client/runtime/library";

export const dynamic = "force-dynamic";

/** POST — copia linhas da tabela geral para uma tabela específica baseado nas seleções (produto + medidas) */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const { selecoes } = json; // Array de {produtoId, medidas: number[]}

    if (!Array.isArray(selecoes) || selecoes.length === 0) {
      return unprocessable({ message: "Lista de seleções é obrigatória" });
    }

    const produtoIds = selecoes.map((s: any) => s.produtoId);

    // Verificar se a tabela existe
    const tabela = await prisma.tabelaPreco.findUnique({
      where: { id: params.id },
    });

    if (!tabela) return notFound();

    // Buscar produtos com suas variações e categorias/famílias
    const produtos = await prisma.produto.findMany({
      where: {
        id: { in: produtoIds },
      },
      include: {
        categoria: { select: { nome: true } },
        familia: { select: { nome: true } },
        variacoes: {
          orderBy: { medida_cm: "asc" },
        },
      },
    });

    if (produtos.length === 0) {
      return ok({ 
        message: "Nenhum produto encontrado",
        copiadas: 0 
      });
    }

    // Buscar linhas da tabela geral (tabelaPrecoId: null) para as medidas selecionadas
    const linhasGerais = await prisma.tabelaPrecoLinha.findMany({
      where: {
        tabelaPrecoId: null, // Apenas linhas da tabela geral
        OR: selecoes.map((sel: any) => ({
          produtoId: sel.produtoId,
          medida_cm: { in: sel.medidas || [] },
        })),
      },
      include: {
        produto: {
          include: {
            categoria: { select: { nome: true } },
            familia: { select: { nome: true } },
          },
        },
      },
    });

    // Criar um mapa de linhas da tabela geral por produtoId_medida_cm
    const linhasGeraisMap = new Map<string, typeof linhasGerais[0]>();
    linhasGerais.forEach((linha) => {
      const key = `${linha.produtoId}_${linha.medida_cm}`;
      linhasGeraisMap.set(key, linha);
    });

    // Criar linhas para a nova tabela baseado nas seleções
    // Processar cada seleção (produto + medidas)
    let linhasParaCriar: any[] = [];

    for (const selecao of selecoes) {
      const produto = produtos.find((p) => p.id === selecao.produtoId);
      if (!produto) continue;

      const medidas = selecao.medidas || [];
      if (medidas.length === 0) continue;

      // Para cada medida selecionada
      for (const medida_cm of medidas) {
        const key = `${produto.id}_${medida_cm}`;
        const linhaGeral = linhasGeraisMap.get(key);

        if (linhaGeral) {
          // Usar linha da tabela geral (com preços)
          linhasParaCriar.push({
            produtoId: linhaGeral.produtoId,
            tabelaPrecoId: params.id,
            medida_cm: linhaGeral.medida_cm,
            largura_cm: linhaGeral.largura_cm,
            profundidade_cm: linhaGeral.profundidade_cm,
            altura_cm: linhaGeral.altura_cm,
            largura_assento_cm: linhaGeral.largura_assento_cm,
            altura_assento_cm: linhaGeral.altura_assento_cm,
            largura_braco_cm: linhaGeral.largura_braco_cm,
            metragem_tecido_m: linhaGeral.metragem_tecido_m,
            metragem_couro_m: linhaGeral.metragem_couro_m,
            preco_grade_1000: new Decimal(linhaGeral.preco_grade_1000),
            preco_grade_2000: new Decimal(linhaGeral.preco_grade_2000),
            preco_grade_3000: new Decimal(linhaGeral.preco_grade_3000),
            preco_grade_4000: new Decimal(linhaGeral.preco_grade_4000),
            preco_grade_5000: new Decimal(linhaGeral.preco_grade_5000),
            preco_grade_6000: new Decimal(linhaGeral.preco_grade_6000),
            preco_grade_7000: new Decimal(linhaGeral.preco_grade_7000),
            preco_couro: new Decimal(linhaGeral.preco_couro),
            nomeProduto: linhaGeral.produto.nome,
            categoriaTxt: linhaGeral.produto.categoria.nome,
            familiaTxt: linhaGeral.produto.familia.nome,
            tipoTxt: linhaGeral.produto.tipo,
            aberturaTxt: linhaGeral.produto.abertura,
            acionamentoTxt: linhaGeral.produto.acionamento,
          });
        } else {
          // Buscar variação do produto para esta medida
          const variacao = produto.variacoes?.find((v) => v.medida_cm === medida_cm);
          
          if (variacao) {
            // Criar linha a partir da variação (sem preços, apenas skeleton)
            linhasParaCriar.push({
              produtoId: produto.id,
              tabelaPrecoId: params.id,
              medida_cm: variacao.medida_cm,
              largura_cm: variacao.largura_cm,
              profundidade_cm: variacao.profundidade_cm,
              altura_cm: variacao.altura_cm,
              largura_assento_cm: variacao.largura_assento_cm,
              altura_assento_cm: variacao.altura_assento_cm,
              largura_braco_cm: variacao.largura_braco_cm,
              metragem_tecido_m: variacao.metragem_tecido_m,
              metragem_couro_m: variacao.metragem_couro_m,
              preco_grade_1000: new Decimal(0),
              preco_grade_2000: new Decimal(0),
              preco_grade_3000: new Decimal(0),
              preco_grade_4000: new Decimal(0),
              preco_grade_5000: new Decimal(0),
              preco_grade_6000: new Decimal(0),
              preco_grade_7000: new Decimal(0),
              preco_couro: new Decimal(0),
              nomeProduto: produto.nome,
              categoriaTxt: produto.categoria.nome,
              familiaTxt: produto.familia.nome,
              tipoTxt: produto.tipo,
              aberturaTxt: produto.abertura,
              acionamentoTxt: produto.acionamento,
            });
          }
        }
      }
    }

    // Usar createMany para inserir em lote (mais eficiente)
    // Mas primeiro verificar se já existem linhas para evitar duplicatas
    const linhasExistentes = await prisma.tabelaPrecoLinha.findMany({
      where: {
        tabelaPrecoId: params.id,
        produtoId: { in: produtoIds },
      },
      select: {
        produtoId: true,
        medida_cm: true,
      },
    });

    const chavesExistentes = new Set(
      linhasExistentes.map((l) => `${l.produtoId}_${l.medida_cm}`)
    );

    const linhasNovas = linhasParaCriar.filter(
      (l) => !chavesExistentes.has(`${l.produtoId}_${l.medida_cm}`)
    );

    console.log(`Total de linhas para criar: ${linhasParaCriar.length}, novas: ${linhasNovas.length}`);
    
    if (linhasNovas.length > 0) {
      console.log("Primeira linha exemplo:", JSON.stringify(linhasNovas[0], null, 2));
      try {
        const result = await prisma.tabelaPrecoLinha.createMany({
          data: linhasNovas,
          skipDuplicates: true,
        });
        console.log(`Criadas ${result.count} linhas para a tabela ${params.id}`);
        
        // Atualizar a data de última atualização da tabela
        await prisma.tabelaPreco.update({
          where: { id: params.id },
          data: { updatedAt: new Date() },
        });
        
        // Verificar se as linhas foram realmente criadas
        const linhasVerificacao = await prisma.tabelaPrecoLinha.findMany({
          where: { tabelaPrecoId: params.id },
          select: { id: true, produtoId: true, medida_cm: true },
        });
        console.log(`Verificação: ${linhasVerificacao.length} linhas encontradas na tabela ${params.id}`);
      } catch (createError: any) {
        console.error("Erro ao criar linhas:", createError);
        throw createError;
      }
    } else {
      console.log("Nenhuma linha nova para criar (todas já existem)");
    }

    const totalLinhas = linhasParaCriar.length;
    const linhasDaGeral = linhasParaCriar.filter((l) => {
      const key = `${l.produtoId}_${l.medida_cm}`;
      return linhasGeraisMap.has(key);
    }).length;
    const linhasDasVariacoes = totalLinhas - linhasDaGeral;

    return ok({
      message: `${linhasNovas.length} linha(s) gerada(s) com sucesso (${linhasDaGeral} da tabela geral, ${linhasDasVariacoes} das variações)`,
      copiadas: linhasNovas.length,
      total: totalLinhas,
      daGeral: linhasDaGeral,
      dasVariacoes: linhasDasVariacoes,
    });
  } catch (e: any) {
    console.error("Erro ao copiar linhas:", e);
    return serverError(e?.message || "Erro ao copiar linhas");
  }
}

