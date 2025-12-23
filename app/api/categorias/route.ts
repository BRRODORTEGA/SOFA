import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, serverError, paginateParams } from "@/lib/http";
import { categoriaSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const { limit, offset, q } = paginateParams(new URL(req.url).searchParams);
    
    // Buscar configurações do site para verificar produtos ativos da tabela vigente
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        tabelaPrecoVigenteId: true,
        produtosAtivosTabelaVigente: true,
      },
    });

    // Preparar filtro de produtos ativos para contagem
    const produtosAtivosFilterContagem: any = { status: true };
    if (siteConfig?.tabelaPrecoVigenteId) {
      if (siteConfig.produtosAtivosTabelaVigente && siteConfig.produtosAtivosTabelaVigente.length > 0) {
        produtosAtivosFilterContagem.id = { in: siteConfig.produtosAtivosTabelaVigente };
      } else {
        produtosAtivosFilterContagem.id = { in: [] };
      }
    }
    
    // Construir filtro: sempre incluir ativo: true, e adicionar busca se houver
    const where: any = { ativo: true };
    if (q) {
      where.nome = { contains: q, mode: "insensitive" };
    }
    
    const [items, total] = await Promise.all([
      prisma.categoria.findMany({ 
        where, 
        take: limit, 
        skip: offset, 
        orderBy: { nome: "asc" }, // Ordenar por nome
        include: {
          _count: {
            select: {
              produtos: {
                where: produtosAtivosFilterContagem
              }
            }
          }
        }
      }).catch(() => prisma.categoria.findMany({
        where, 
        take: limit, 
        skip: offset,
        include: {
          _count: {
            select: {
              produtos: {
                where: produtosAtivosFilterContagem
              }
            }
          }
        }
      })),
      prisma.categoria.count({ where }),
    ]);
    return ok({ items, total, limit, offset });
  } catch (e) {
    return serverError();
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = categoriaSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());
    const createdItem = await prisma.categoria.create({ data: parsed.data });
    return created(createdItem);
  } catch (e) {
    return serverError();
  }
}




