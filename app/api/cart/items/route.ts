import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";
import { getPrecoUnitario } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { produtoId, tecidoId, variacaoMedida_cm, quantidade } = await req.json();
    if (!produtoId || !tecidoId || !variacaoMedida_cm || !quantidade) {
      return unprocessable({ message: "Campos obrigatórios" });
    }

    const carrinho = await prisma.carrinho.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const precoBase = await getPrecoUnitario(produtoId, Number(variacaoMedida_cm), tecidoId);
    if (precoBase === null) {
      return unprocessable({ message: "Preço não disponível para esta combinação" });
    }

    // Buscar desconto do produto em destaque
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        descontosProdutosDestaque: true,
      },
    }) as any;

    const descontos = (siteConfig?.descontosProdutosDestaque as Record<string, number>) || {};
    const descontoPercentual = descontos[produtoId] || 0;
    
    // Aplicar desconto se houver
    const previewPrecoUnit = descontoPercentual > 0
      ? precoBase * (1 - descontoPercentual / 100)
      : precoBase;

    const item = await prisma.carrinhoItem.create({
      data: {
        carrinhoId: carrinho.id,
        produtoId,
        tecidoId,
        variacaoMedida_cm: Number(variacaoMedida_cm),
        quantidade: Number(quantidade),
        previewPrecoUnit: Number(previewPrecoUnit.toFixed(2)), // Garantir que seja número
      },
      include: {
        produto: { select: { id: true, nome: true, imagens: true } },
        tecido: { select: { id: true, nome: true, grade: true } },
      },
    });

    return ok(item);
  } catch (e: any) {
    if (e.message) {
      return unprocessable({ message: e.message });
    }
    return serverError();
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const { itemId, quantidade } = await req.json();
    if (!itemId || !quantidade) return unprocessable({ message: "itemId/quantidade obrigatórios" });

    const item = await prisma.carrinhoItem.update({
      where: { id: itemId },
      data: { quantidade: Number(quantidade) },
    });

    return ok(item);
  } catch {
    return serverError();
  }
}

export async function DELETE(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return unprocessable({ message: "id obrigatório" });

    await prisma.carrinhoItem.delete({ where: { id } });
    return ok({ deleted: true });
  } catch {
    return serverError();
  }
}

