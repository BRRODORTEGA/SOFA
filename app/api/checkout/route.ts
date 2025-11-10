import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";
import { getPrecoUnitario } from "@/lib/pricing";
import { gerarCodigoPedido } from "@/lib/orders";
import { enviarEmailLog } from "@/lib/email-orders";
import { OrderPlacedEmail } from "@/emails/order_placed";
import { FactoryNewOrderEmail } from "@/emails/factory_new_order";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response("Unauthorized", { status: 401 });

    const carrinho = await prisma.carrinho.findUnique({
      where: { userId: user.id },
      include: { itens: true },
    });

    if (!carrinho || carrinho.itens.length === 0) {
      return new Response("Carrinho vazio", { status: 400 });
    }

    const codigo = gerarCodigoPedido();

    // Resolve preços atuais e total
    let total = 0;
    const itensData = [];
    for (const it of carrinho.itens) {
      const precoUnit = await getPrecoUnitario(it.produtoId, it.variacaoMedida_cm, it.tecidoId);
      total += precoUnit * it.quantidade;
      itensData.push({
        produtoId: it.produtoId,
        tecidoId: it.tecidoId,
        variacaoMedida_cm: it.variacaoMedida_cm,
        quantidade: it.quantidade,
        precoUnit,
      });
    }

    const pedido = await prisma.pedido.create({
      data: {
        codigo,
        clienteId: user.id,
        status: "Solicitado",
        itens: { createMany: { data: itensData } },
        historico: { create: { status: "Solicitado", userId: user.id } },
      },
      include: { itens: true },
    });

    // Limpa carrinho
    await prisma.carrinhoItem.deleteMany({ where: { carrinhoId: carrinho.id } });

    // E-mails
    await enviarEmailLog({
      to: user.email,
      subject: `Recebemos seu pedido ${codigo}`,
      template: "order_placed",
      react: OrderPlacedEmail({ name: user.name ?? "Cliente", codigo, total }),
    });

    // Destino fábrica (ajuste para e-mail real da operação)
    const fabricaEmail = "fabrica@seusite.com";
    await enviarEmailLog({
      to: fabricaEmail,
      subject: `Novo pedido ${codigo}`,
      template: "factory_new_order",
      react: FactoryNewOrderEmail({ codigo, itens: pedido.itens }),
    });

    return ok({ pedidoId: pedido.id, codigo, total });
  } catch (e: any) {
    console.error("Checkout error:", e);
    return serverError();
  }
}

