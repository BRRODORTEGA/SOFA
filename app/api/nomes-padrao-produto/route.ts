import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, serverError, paginateParams } from "@/lib/http";
import { z } from "zod";

const nomePadraoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  ativo: z.boolean().default(true),
  ordem: z.number().int().optional().nullable(),
});

export async function GET(req: Request) {
  try {
    const { limit, offset, q } = paginateParams(new URL(req.url).searchParams);
    
    const where: any = {};
    
    if (q) {
      where.nome = { contains: q, mode: "insensitive" };
    }
    
    const [items, total] = await Promise.all([
      prisma.nomePadraoProduto.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [
          { ordem: "asc" },
          { nome: "asc" },
        ],
      }),
      prisma.nomePadraoProduto.count({ where }),
    ]);
    
    return ok({ items, total, limit, offset });
  } catch (error: any) {
    console.error("Erro ao listar nomes padrão:", error);
    return serverError(error?.message || "Erro ao listar nomes padrão");
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = nomePadraoSchema.safeParse(json);
    
    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
    }
    
    const createdItem = await prisma.nomePadraoProduto.create({
      data: parsed.data,
    });
    
    return created(createdItem);
  } catch (e: any) {
    console.error("Erro ao criar nome padrão:", e);
    
    // Erro de duplicata
    if (e?.code === "P2002") {
      return unprocessable({
        message: "Já existe um nome padrão com este nome.",
      });
    }
    
    return serverError(e?.message || "Erro ao criar nome padrão");
  }
}


