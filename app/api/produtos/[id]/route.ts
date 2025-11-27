import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";
import { produtoSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.produto.findUnique({
    where: { id: params.id },
    include: {
      familia: { select: { nome: true } },
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
    },
  });

  if (!item) return notFound();

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
    
    // Buscar produto atual para preservar o acionamento
    const produtoAtual = await prisma.produto.findUnique({
      where: { id: params.id },
      select: { acionamento: true },
    });
    
    if (!produtoAtual) {
      return notFound();
    }
    
    const parsed = produtoSchema.safeParse(json);
    if (!parsed.success) {
      console.log("Erro de validação:", parsed.error.flatten()); // Debug
      return unprocessable(parsed.error.flatten());
    }
    
    console.log("Dados validados:", parsed.data); // Debug
    
    // Preservar o acionamento original (não permitir alteração)
    const acionamentoFinal = produtoAtual.acionamento; // Manter o acionamento original
    
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
    
    const dataToUpdate = {
      ...parsed.data,
      acionamento: acionamentoFinal,
    };
    
    const updated = await prisma.produto.update({ 
      where: { id: params.id }, 
      data: dataToUpdate 
    });
    
    console.log("Produto atualizado:", updated); // Debug
    return ok(updated);
  } catch (e: any) {
    console.error("Erro ao atualizar produto:", e); // Debug
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro interno do servidor");
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




