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

    // Verificar se há múltiplos acionamentos
    const acionamento = parsed.data.acionamento;
    const acionamentos = acionamento 
      ? acionamento.split(",").map(a => a.trim()).filter(Boolean)
      : [null];

    // Se houver apenas um acionamento (ou nenhum), criar produto normalmente
    if (acionamentos.length === 1) {
      const createdItem = await prisma.produto.create({ 
        data: {
          ...parsed.data,
          acionamento: acionamentos[0],
        }
      });
      return created(createdItem);
    }

    // Se houver múltiplos acionamentos, criar um produto para cada um
    const createdItems = [];
    for (const acionamentoValue of acionamentos) {
      const item = await prisma.produto.create({
        data: {
          ...parsed.data,
          acionamento: acionamentoValue,
          // Adicionar sufixo ao nome para diferenciar (opcional)
          nome: acionamentos.length > 1 
            ? `${parsed.data.nome} (${acionamentoValue})`
            : parsed.data.nome,
        },
      });
      createdItems.push(item);
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




