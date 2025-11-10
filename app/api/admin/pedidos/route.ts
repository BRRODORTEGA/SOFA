import { requireAdminSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ok, paginateParams } from "@/lib/http";

export async function GET(req: Request) {
  await requireAdminSession();

  const { limit, offset, q } = paginateParams(new URL(req.url).searchParams);

  const where: any = {};
  if (q) {
    where.OR = [
      { codigo: { contains: q, mode: "insensitive" } },
      { cliente: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        cliente: { select: { id: true, name: true, email: true } },
        itens: { take: 1 },
      },
    }),
    prisma.pedido.count({ where }),
  ]);

  return ok({ items, total, limit, offset });
}

