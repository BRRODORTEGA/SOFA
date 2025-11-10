import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound } from "@/lib/http";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { texto } = await req.json();
  if (!texto?.trim()) return unprocessable({ message: "Mensagem vazia" });

  const ped = await prisma.pedido.findFirst({ where: { id: params.id, clienteId: user.id } });
  if (!ped) return notFound();

  const msg = await prisma.mensagemPedido.create({
    data: { pedidoId: ped.id, userId: user.id, role: user.role, texto },
  });

  return ok(msg);
}

