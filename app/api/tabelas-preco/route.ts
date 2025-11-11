import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";
import { tabelaPrecoSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** GET — lista todas as tabelas de preços */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    
    const where = q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { descricao: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.tabelaPreco.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { linhas: true },
          },
        },
      }),
      prisma.tabelaPreco.count({ where }),
    ]);

    return ok({ items, total });
  } catch (e: any) {
    return serverError(e?.message || "Erro ao listar tabelas de preços");
  }
}

/** POST — cria nova tabela de preços */
export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = tabelaPrecoSchema.safeParse(json);
    
    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
    }

    const item = await prisma.tabelaPreco.create({
      data: {
        nome: parsed.data.nome,
        ativo: parsed.data.ativo ?? true,
        descricao: parsed.data.descricao || null,
      },
    });

    return ok({ item });
  } catch (e: any) {
    return serverError(e?.message || "Erro ao criar tabela de preços");
  }
}


