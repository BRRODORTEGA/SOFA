import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/http";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const pedido = await prisma.pedido.findFirst({
    where: { id: params.id, clienteId: user.id },
    include: {
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

