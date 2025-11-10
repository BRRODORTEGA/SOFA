import { requireAdminSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/http";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await requireAdminSession();

  const pedido = await prisma.pedido.findUnique({
    where: { id: params.id },
    include: {
      cliente: { select: { id: true, name: true, email: true } },
      itens: {
        include: {
          produto: { select: { id: true, nome: true, imagens: true } },
          tecido: { select: { id: true, nome: true, grade: true } },
        },
      },
      historico: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!pedido) return notFound();

  const mensagens = await prisma.mensagemPedido.findMany({
    where: { pedidoId: pedido.id },
    orderBy: { createdAt: "asc" },
  });

  return ok({ pedido, mensagens });
}

