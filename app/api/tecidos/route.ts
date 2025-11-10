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
    const parsed = tecidoSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());
    const createdItem = await prisma.tecido.create({ data: parsed.data });
    return created(createdItem);
  } catch (e) {
    return serverError();
  }
}




