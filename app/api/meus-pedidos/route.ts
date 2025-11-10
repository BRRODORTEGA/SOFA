import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      itens: {
        include: {
          produto: { select: { nome: true } },
          tecido: { select: { nome: true, grade: true } },
        },
      },
    },
  });

  return ok({ items: pedidos });
}

