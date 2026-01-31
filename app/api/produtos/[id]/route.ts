import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";
import { produtoSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.produto.findUnique({
    where: { id: params.id },
    include: {
      familia: { select: { nome: true, descricao: true } },
      categoria: { select: { nome: true } },
      tecidos: {
        include: {
          tecido: { select: { id: true, nome: true, grade: true, imagemUrl: true } },
        },
      },
      variacoes: {
        select: {
          medida_cm: true,
          largura_cm: true,
          profundidade_cm: true,
          altura_cm: true,
        },
        orderBy: { medida_cm: "asc" },
      },
      imagensDetalhadas: {
        select: {
          id: true,
          url: true,
          tecidoId: true,
          tipo: true,
          ordem: true,
        },
        orderBy: [{ tipo: "asc" }, { ordem: "asc" }],
      },
    },
  });

  if (!item) return notFound();

  // Garantir informacoesAdicionais mesmo com Prisma Client gerado antes do campo existir
  const itemWithInfo = item as { informacoesAdicionais?: string | null };
  if (itemWithInfo.informacoesAdicionais === undefined) {
    const row = await prisma.$queryRaw<[{ informacoesAdicionais: string | null }]>`
      SELECT "informacoesAdicionais" FROM "Produto" WHERE id = ${params.id}
    `.then((rows) => rows[0]);
    if (row) (item as Record<string, unknown>).informacoesAdicionais = row.informacoesAdicionais;
  }

  // Transformar tecidos para formato mais simples
  const produto = {
    ...item,
    tecidos: item.tecidos.map((pt) => pt.tecido),
  };

  return ok(produto);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    console.log("PUT /api/produtos/[id] - Recebido:", json); // Debug
    
    
    const parsed = produtoSchema.safeParse(json);
    if (!parsed.success) {
      console.log("Erro de validação:", parsed.error.flatten()); // Debug
      return unprocessable(parsed.error.flatten());
    }
    
    console.log("Dados validados:", parsed.data); // Debug
    
    // Buscar produto atual para verificar nome atual
    const produtoAtualCompleto = await prisma.produto.findUnique({
      where: { id: params.id },
      select: { nome: true, acionamento: true },
    });
    
    if (!produtoAtualCompleto) {
      return notFound();
    }
    
    // Verificar se o nome está na lista de nomes padrões ativos
    // Permitir manter o nome atual mesmo se não estiver mais ativo (para não quebrar produtos existentes)
    const nomeMudou = produtoAtualCompleto.nome !== parsed.data.nome;
    
    if (nomeMudou) {
      const nomePadrao = await prisma.nomePadraoProduto.findFirst({
        where: {
          nome: parsed.data.nome,
          ativo: true,
        },
      });

      if (!nomePadrao) {
        return unprocessable({
          message: `O nome "${parsed.data.nome}" não está na lista de nomes padrões ativos. Selecione um nome válido da lista.`,
        });
      }
    }
    
    // Preservar o acionamento original (não permitir alteração)
    const acionamentoFinal = produtoAtualCompleto.acionamento; // Manter o acionamento original
    
    // Verificar se já existe outro produto (diferente do atual) com a mesma combinação
    const produtoExistente = await prisma.produto.findFirst({
      where: {
        id: { not: params.id }, // Excluir o produto atual da busca
        categoriaId: parsed.data.categoriaId,
        familiaId: parsed.data.familiaId,
        nome: parsed.data.nome,
        tipo: parsed.data.tipo || null,
        abertura: parsed.data.abertura || null,
        acionamento: acionamentoFinal || null,
      },
    });

    if (produtoExistente) {
      return unprocessable({
        message: "Já existe outro produto com esta combinação de Categoria, Família, Nome, Tipo, Abertura e Acionamento.",
      });
    }
    
    // Remover campos que não devem ser atualizados diretamente ou que não existem no modelo
    const { categoriaId, familiaId, nome, tipo, abertura, possuiLados, configuracao, informacoesAdicionais, status, imagens, ...rest } = parsed.data;
    
    // Usar connect para relações (compatível com o Prisma Client gerado).
    // informacoesAdicionais é atualizado em query raw abaixo (compatível quando o Client foi gerado antes do campo existir).
    const dataToUpdate = {
      categoria: { connect: { id: categoriaId } },
      familia: { connect: { id: familiaId } },
      nome,
      tipo: tipo || null,
      abertura: abertura || null,
      acionamento: acionamentoFinal,
      possuiLados: possuiLados ?? false,
      configuracao: configuracao || null,
      status: status ?? true,
      imagens: imagens || [],
    };
    
    // Se houver imagensDetalhadas no payload, processá-las
    const imagensDetalhadas = (json as any).imagensDetalhadas;
    const clearImages = (json as any).clearImages === true; // Flag explícita para limpar imagens

    const updated = await prisma.$transaction(async (tx) => {
      // Atualizar produto (campos conhecidos pelo Client)
      const produtoAtualizado = await tx.produto.update({
        where: { id: params.id },
        data: dataToUpdate,
      });

      // Atualizar informacoesAdicionais em raw (funciona mesmo com Prisma Client gerado antes do campo existir)
      const infoAdic = informacoesAdicionais ?? null;
      await tx.$executeRaw`
        UPDATE "Produto" SET "informacoesAdicionais" = ${infoAdic} WHERE id = ${params.id}
      `;

      // Só alterar imagens detalhadas quando houver lista nova com itens, ou quando clearImages for true com array vazio
      // Evita apagar imagens por engano quando o front envia imagensDetalhadas: [] (ex.: submit acidental de outro formulário)
      if (imagensDetalhadas && Array.isArray(imagensDetalhadas) && imagensDetalhadas.length > 0) {
        await tx.produtoImagem.deleteMany({ where: { produtoId: params.id } });
        await tx.produtoImagem.createMany({
          data: imagensDetalhadas
            .filter((img: any) => img && img.url && typeof img.url === "string" && img.url.trim() !== "")
            .map((img: any, index: number) => ({
              produtoId: params.id,
              url: img.url.trim(),
              tecidoId: img.tecidoId && img.tecidoId.trim() !== "" ? img.tecidoId : null,
              tipo: img.tipo || "complementar",
              ordem: img.ordem ?? index,
            })),
        });
      } else if (imagensDetalhadas && Array.isArray(imagensDetalhadas) && imagensDetalhadas.length === 0 && clearImages) {
        await tx.produtoImagem.deleteMany({ where: { produtoId: params.id } });
      }
      // Se imagensDetalhadas for [] e clearImages não for true: não altera imagens (proteção)

      return produtoAtualizado;
    });
    
    console.log("Produto atualizado:", updated); // Debug
    return ok(updated);
  } catch (e: any) {
    console.error("Erro ao atualizar produto:", e); // Debug
    console.error("Código do erro:", e?.code);
    console.error("Mensagem do erro:", e?.message);
    console.error("Meta do erro:", e?.meta);
    
    if (e?.code === "P2025") return notFound();
    if (e?.code === "P2021") {
      // Tabela não existe
      return serverError(`Tabela não encontrada: ${e?.meta?.table || 'desconhecida'}. Verifique se as migrações foram aplicadas.`);
    }
    
    // Retornar mensagem de erro mais detalhada
    const errorMessage = e?.message || "Erro interno do servidor";
    return serverError(errorMessage);
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se o produto existe e tem relacionamentos
    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      include: {
        itens: { take: 1 },
        carrinhoItems: { take: 1 },
        _count: {
          select: {
            itens: true,
            carrinhoItems: true,
            variacoes: true,
            precos: true,
            tecidos: true,
          },
        },
      },
    });

    if (!produto) {
      return notFound();
    }

    // Verificar se há relacionamentos que impedem a exclusão
    if (produto._count.itens > 0) {
      return Response.json({ 
        ok: false, 
        error: "Não é possível excluir este produto pois ele está sendo usado em pedidos. Remova os pedidos primeiro." 
      }, { status: 422 });
    }

    if (produto._count.carrinhoItems > 0) {
      return Response.json({ 
        ok: false, 
        error: "Não é possível excluir este produto pois ele está no carrinho de compras de algum cliente." 
      }, { status: 422 });
    }

    // Excluir relacionamentos que podem ser removidos automaticamente
    // Primeiro, excluir variações, preços e tecidos vinculados
    await prisma.$transaction([
      // Excluir variações
      prisma.variacao.deleteMany({ where: { produtoId: params.id } }),
      // Excluir linhas de preço
      prisma.tabelaPrecoLinha.deleteMany({ where: { produtoId: params.id } }),
      // Excluir vínculos com tecidos
      prisma.produtoTecido.deleteMany({ where: { produtoId: params.id } }),
      // Excluir imagens detalhadas
      prisma.produtoImagem.deleteMany({ where: { produtoId: params.id } }),
    ]);

    // Agora excluir o produto
    await prisma.produto.delete({ where: { id: params.id } });
    console.log("Produto excluído com sucesso:", params.id);
    return ok({ deleted: true });
  } catch (e: any) {
    console.error("Erro ao excluir produto:", e);
    if (e?.code === "P2025") return notFound();
    
    // Erro de constraint de foreign key
    if (e?.code === "P2003" || 
        e?.message?.includes("foreign key") || 
        e?.message?.includes("violates") ||
        e?.message?.includes("referenced from table")) {
      return Response.json({ 
        ok: false, 
        error: "Não é possível excluir este produto pois ele está sendo usado em outros registros (pedidos, carrinho, etc.)." 
      }, { status: 422 });
    }
    
    return serverError(e?.message || "Erro ao excluir produto");
  }
}




