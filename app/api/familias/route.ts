import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, serverError, paginateParams } from "@/lib/http";
import { familiaSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { limit, offset, q } = paginateParams(new URL(req.url).searchParams);
  
  // Construir filtro: sempre incluir ativo: true, e adicionar busca se houver
  const where: any = { ativo: true };
  if (q) {
    where.nome = { contains: q, mode: "insensitive" };
  }
  
  const [items, total] = await Promise.all([
    prisma.familia.findMany({
      where,
      include: { categoria: { select: { id: true, nome: true } } },
      take: limit,
      skip: offset,
      orderBy: { nome: "asc" }, // Ordenar por nome ao invés de createdAt
    }).catch(() => prisma.familia.findMany({ where, take: limit, skip: offset })),
    prisma.familia.count({ where }),
  ]);
  return ok({ items, total, limit, offset });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = familiaSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Erro de validação:", parsed.error.flatten());
      return unprocessable(parsed.error.flatten());
    }
    
    // Preparar dados - categoriaId pode ser null/undefined
    const data: any = { 
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      ativo: parsed.data.ativo ?? true,
      perfilMedidas: parsed.data.perfilMedidas || null,
    };
    
    // Adicionar categoriaId apenas se fornecido
    if (parsed.data.categoriaId) {
      data.categoriaId = parsed.data.categoriaId;
    }
    
    console.log("Criando família com dados:", data);
    const createdItem = await prisma.familia.create({ data });
    return created(createdItem);
  } catch (e: any) {
    console.error("Erro ao criar família:", e);
    return serverError(e?.message || "Erro ao criar família");
  }
}




