import { requireAdminSession } from "@/lib/auth-guard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound } from "@/lib/http";
import { enviarEmailLog } from "@/lib/email-orders";
import { OrderRejectedEmail } from "@/emails/order_rejected";
import { OrderStatusUpdatedEmail } from "@/emails/order_status_updated";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdminSession();
  const { novoStatus, motivo } = await req.json();

  if (!novoStatus) return unprocessable({ message: "novoStatus obrigatório" });

  const pedido = await prisma.pedido.findUnique({
    where: { id: params.id },
    include: { cliente: true },
  });

  if (!pedido) return notFound();

  await prisma.$transaction([
    prisma.pedido.update({ where: { id: pedido.id }, data: { status: novoStatus } }),
    prisma.pedidoStatusHistory.create({
      data: {
        pedidoId: pedido.id,
        status: novoStatus,
        reason: motivo ?? null,
        userId: session.user?.email ? (await prisma.user.findUnique({ where: { email: session.user.email } }))?.id ?? null : null,
      },
    }),
  ]);

  if (novoStatus === "Reprovado") {
    await enviarEmailLog({
      to: pedido.cliente.email,
      subject: `Seu pedido ${pedido.codigo} foi reprovado`,
      template: "order_rejected",
      react: OrderRejectedEmail({ codigo: pedido.codigo, motivo: motivo ?? "" }),
    });
  }

  // E-mail genérico para outras mudanças de status
  if (novoStatus !== "Reprovado" && novoStatus !== "Solicitado") {
    await enviarEmailLog({
      to: pedido.cliente.email,
      subject: `Atualização do pedido ${pedido.codigo}`,
      template: "order_status_updated",
      react: OrderStatusUpdatedEmail({ codigo: pedido.codigo, novoStatus }),
    });
  }

  return ok({ updated: true });
}

