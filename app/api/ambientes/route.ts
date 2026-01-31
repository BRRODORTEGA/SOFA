import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, serverError, paginateParams } from "@/lib/http";
import { ambienteSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const { limit, offset, q } = paginateParams(url.searchParams);
    const ativoOnly = url.searchParams.get("ativo") === "true";
    const where: any = q ? { nome: { contains: q, mode: "insensitive" as const } } : {};
    if (ativoOnly) where.ativo = true;
    const [items, total] = await Promise.all([
      prisma.ambiente.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { nome: "asc" },
      }),
      prisma.ambiente.count({ where }),
    ]);
    return ok({ items, total, limit, offset });
  } catch (e) {
    return serverError();
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = ambienteSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());
    const createdItem = await prisma.ambiente.create({ data: parsed.data });
    return created(createdItem);
  } catch (e) {
    return serverError();
  }
}
