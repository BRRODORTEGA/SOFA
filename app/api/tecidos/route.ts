import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, serverError, paginateParams } from "@/lib/http";
import { tecidoSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { limit, offset, q } = paginateParams(new URL(req.url).searchParams);
  const where = q ? { nome: { contains: q, mode: "insensitive" } } : {};
  const [items, total] = await Promise.all([
    prisma.tecido.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" } }).catch(() => prisma.tecido.findMany({ where, take: limit, skip: offset })),
    prisma.tecido.count({ where }),
  ]);
  return ok({ items, total, limit, offset });
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    console.log("POST /api/tecidos - Recebido:", json); // Debug
    
    const parsed = tecidoSchema.safeParse(json);
    if (!parsed.success) {
      console.log("Erro de validação:", parsed.error.flatten()); // Debug
      return unprocessable(parsed.error.flatten());
    }
    
    console.log("Dados validados:", parsed.data); // Debug
    
    const createdItem = await prisma.tecido.create({ data: parsed.data });
    console.log("Tecido criado:", createdItem); // Debug
    return created(createdItem);
  } catch (e: any) {
    console.error("Erro ao criar tecido:", e); // Debug
    return serverError(e?.message || "Erro interno do servidor");
  }
}




