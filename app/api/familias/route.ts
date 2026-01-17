import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, serverError, paginateParams } from "@/lib/http";
import { familiaSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { limit, offset, q } = paginateParams(new URL(req.url).searchParams);
  const searchParams = new URL(req.url).searchParams;
  const all = searchParams.get("all") === "true"; // Parâmetro para retornar todas as famílias (ativas e inativas)
  
  // Construir filtro
  const where: any = {};
  
  // Se não for "all", filtrar apenas famílias ativas
  if (!all) {
    where.ativo = true;
  }
  
  if (q) {
    where.nome = { contains: q, mode: "insensitive" };
  }
  
  // Preparar filtro de produtos ativos para contagem (similar ao usado em categorias)
  const produtosAtivosFilterContagem: any = { status: true };
  
  // Buscar configurações do site para verificar tabela vigente
  const siteConfig = await prisma.siteConfig.findUnique({
    where: { id: "site-config" },
    select: {
      tabelaPrecoVigenteId: true,
      produtosAtivosTabelaVigente: true,
    },
  }) as any;

  if (siteConfig?.tabelaPrecoVigenteId) {
    const produtosAtivosContagem = siteConfig.produtosAtivosTabelaVigente || [];
    if (produtosAtivosContagem.length > 0) {
      produtosAtivosFilterContagem.id = { in: produtosAtivosContagem };
    } else {
      produtosAtivosFilterContagem.id = { in: [] };
    }
  }

  const [items, total] = await Promise.all([
    prisma.familia.findMany({
      where,
      include: { 
        categoria: { select: { id: true, nome: true } },
        _count: {
          select: {
            produtos: {
              where: produtosAtivosFilterContagem
            }
          }
        }
      },
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




