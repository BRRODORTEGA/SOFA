import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { codigo } = await req.json();
    if (!codigo || typeof codigo !== 'string') {
      return unprocessable({ message: "Código do cupom é obrigatório" });
    }

    // Buscar cupom
    const cupom = await prisma.cupom.findUnique({
      where: { codigo: codigo.toUpperCase().trim() },
    });

    if (!cupom) {
      return unprocessable({ message: "Código de cupom inválido" });
    }

    if (!cupom.ativo) {
      return unprocessable({ message: "Este cupom não está mais ativo" });
    }

    // Verificar data de validade
    const agora = new Date();
    if (cupom.dataInicio && agora < cupom.dataInicio) {
      return unprocessable({ message: "Este cupom ainda não está válido" });
    }

    if (cupom.dataFim && agora > cupom.dataFim) {
      return unprocessable({ message: "Este cupom expirou" });
    }

    // Verificar limite de usos
    if (cupom.limiteUsos !== null && cupom.usosAtuais >= cupom.limiteUsos) {
      return unprocessable({ message: "Este cupom atingiu o limite de usos" });
    }

    // Buscar carrinho para calcular subtotal
    const carrinho = await prisma.carrinho.findUnique({
      where: { userId: user.id },
      include: {
        itens: true,
      },
    });

    if (!carrinho || carrinho.itens.length === 0) {
      return unprocessable({ message: "Carrinho vazio" });
    }

    // Calcular subtotal (aqui precisaríamos calcular os preços reais, mas por enquanto vamos usar um valor aproximado)
    // Por simplicidade, vamos apenas validar o cupom e deixar o cálculo do desconto para quando aplicarmos no checkout

    // Atualizar carrinho com o cupom
    await prisma.carrinho.update({
      where: { userId: user.id },
      data: { cupomCodigo: cupom.codigo },
    });

    return ok({
      cupom: {
        codigo: cupom.codigo,
        descricao: cupom.descricao,
        descontoPercentual: cupom.descontoPercentual ? Number(cupom.descontoPercentual) : null,
        descontoFixo: cupom.descontoFixo ? Number(cupom.descontoFixo) : null,
        valorMinimo: cupom.valorMinimo ? Number(cupom.valorMinimo) : null,
      },
    });
  } catch (error: any) {
    console.error("Erro ao aplicar cupom:", error);
    return serverError();
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Remover cupom do carrinho
    await prisma.carrinho.update({
      where: { userId: user.id },
      data: { cupomCodigo: null },
    });

    return ok({ message: "Cupom removido" });
  } catch (error: any) {
    console.error("Erro ao remover cupom:", error);
    return serverError();
  }
}

