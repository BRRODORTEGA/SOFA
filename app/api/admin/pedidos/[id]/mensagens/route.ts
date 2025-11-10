import { requireAdminSession } from "@/lib/auth-guard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound } from "@/lib/http";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  const { texto } = await req.json();

  if (!texto?.trim()) return unprocessable({ message: "Mensagem vazia" });

  const ped = await prisma.pedido.findUnique({ where: { id: params.id } });
  if (!ped) return notFound();

  const user = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const msg = await prisma.mensagemPedido.create({
    data: { pedidoId: ped.id, userId: user.id, role: user.role, texto },
  });

  return ok(msg);
}

