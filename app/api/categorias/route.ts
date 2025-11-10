import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, serverError, paginateParams } from "@/lib/http";
import { categoriaSchema } from "@/lib/validators";

export async function GET(req: Request) {
  try {
    const { limit, offset, q } = paginateParams(new URL(req.url).searchParams);
    const where = q ? { nome: { contains: q, mode: "insensitive" } } : {};
    const [items, total] = await Promise.all([
      prisma.categoria.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" } }).catch(() => prisma.categoria.findMany({where, take: limit, skip: offset})),
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




