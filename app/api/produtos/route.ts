import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, serverError, paginateParams } from "@/lib/http";
import { produtoSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { limit, offset, q } = paginateParams(new URL(req.url).searchParams);
  const searchParams = new URL(req.url).searchParams;
  const categoriaId = searchParams.get("categoriaId");
  
  const where: any = { status: true };
  
  if (q) {
    where.nome = { contains: q, mode: "insensitive" };
  }
  
  if (categoriaId) {
    where.categoriaId = categoriaId;
  }
  
  const [items, total] = await Promise.all([
    prisma.produto.findMany({
      where,
      include: {
        categoria: { select: { id: true, nome: true } },
        familia: { select: { id: true, nome: true } },
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
    }).catch(() => prisma.produto.findMany({ where, take: limit, skip: offset })),
    prisma.produto.count({ where }),
  ]);
  return ok({ items, total, limit, offset });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = produtoSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());

    // Verificar se o nome está na lista de nomes padrões ativos
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

    // Verificar se há múltiplos acionamentos
    const acionamento = parsed.data.acionamento;
    const acionamentos = acionamento 
      ? acionamento.split(",").map(a => a.trim()).filter(Boolean)
      : [null];

    // Função auxiliar para verificar se produto já existe
    const verificarProdutoExistente = async (
      categoriaId: string,
      familiaId: string,
      nome: string,
      tipo: string | null,
      abertura: string | null,
      acionamento: string | null
    ) => {
      const produtoExistente = await prisma.produto.findFirst({
        where: {
          categoriaId,
          familiaId,
          nome,
          tipo: tipo || null,
          abertura: abertura || null,
          acionamento: acionamento || null,
        },
      });
      return produtoExistente;
    };

    // Se houver apenas um acionamento (ou nenhum), verificar duplicata antes de criar
    if (acionamentos.length === 1) {
      const produtoExistente = await verificarProdutoExistente(
        parsed.data.categoriaId,
        parsed.data.familiaId,
        parsed.data.nome,
        parsed.data.tipo || null,
        parsed.data.abertura || null,
        acionamentos[0]
      );

      if (produtoExistente) {
        return unprocessable({
          message: "Já existe um produto com esta combinação de Categoria, Família, Nome, Tipo, Abertura e Acionamento.",
        });
      }

      const createdItem = await prisma.produto.create({ 
        data: {
          ...parsed.data,
          acionamento: acionamentos[0],
        }
      });
      return created(createdItem);
    }

    // Se houver múltiplos acionamentos, verificar duplicatas antes de criar cada um
    const createdItems = [];
    const produtosDuplicados: string[] = [];

    for (const acionamentoValue of acionamentos) {
      const nomeFinal = acionamentos.length > 1 
        ? `${parsed.data.nome} (${acionamentoValue})`
        : parsed.data.nome;

      const produtoExistente = await verificarProdutoExistente(
        parsed.data.categoriaId,
        parsed.data.familiaId,
        nomeFinal,
        parsed.data.tipo || null,
        parsed.data.abertura || null,
        acionamentoValue
      );

      if (produtoExistente) {
        produtosDuplicados.push(acionamentoValue || "sem acionamento");
        continue; // Pular este acionamento se já existir
      }

      const item = await prisma.produto.create({
        data: {
          ...parsed.data,
          acionamento: acionamentoValue,
          nome: nomeFinal,
        },
      });
      createdItems.push(item);
    }

    // Se todos os produtos já existiam, retornar erro
    if (createdItems.length === 0) {
      return unprocessable({
        message: `Todos os produtos já existem para os acionamentos: ${produtosDuplicados.join(", ")}`,
      });
    }

    // Se alguns produtos foram criados mas outros já existiam, retornar sucesso com aviso
    if (produtosDuplicados.length > 0) {
      return created({
        ...createdItems[createdItems.length - 1],
        _meta: {
          totalCreated: createdItems.length,
          items: createdItems,
          skipped: produtosDuplicados,
        },
      });
    }

    // Retornar o último item criado (para manter compatibilidade com o frontend)
    // Mas incluir informação sobre quantos foram criados
    return created({
      ...createdItems[createdItems.length - 1],
      _meta: {
        totalCreated: createdItems.length,
        items: createdItems,
      },
    });
  } catch (e: any) {
    console.error("Erro ao criar produto(s):", e);
    return serverError(e?.message || "Erro ao criar produto(s)");
  }
}




