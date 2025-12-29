import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";
import { getPrecoUnitario, getDescontoPercentualLinha } from "@/lib/pricing";

/**
 * API para validar e limpar automaticamente o carrinho
 * Remove produtos que não estão mais disponíveis ou que mudaram de preço/desconto
 */
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
      return ok({ 
        validado: true, 
        itensRemovidos: 0,
        itensAtualizados: 0,
        mensagem: "Carrinho vazio"
      });
    }

    // Buscar configurações do site
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        tabelaPrecoVigenteId: true,
        produtosAtivosTabelaVigente: true,
        descontosProdutosDestaque: true,
      },
    }) as any;

    const produtosAtivos = (siteConfig?.produtosAtivosTabelaVigente as string[]) || [];
    const descontos = (siteConfig?.descontosProdutosDestaque as Record<string, number>) || {};

    const itensRemovidos: string[] = [];
    const itensAtualizados: Array<{ id: string; precoAnterior: number; precoNovo: number }> = [];

    for (const item of carrinho.itens) {
      // Verificar se o produto está na lista de produtos ativos
      if (produtosAtivos.length > 0 && !produtosAtivos.includes(item.produtoId)) {
        itensRemovidos.push(item.id);
        continue;
      }

      // Verificar se o preço ainda está disponível
      const precoBase = await getPrecoUnitario(
        item.produtoId,
        item.variacaoMedida_cm,
        item.tecidoId
      );

      if (precoBase === null) {
        itensRemovidos.push(item.id);
        continue;
      }

      // Buscar desconto atual
      const descontoLinha = await getDescontoPercentualLinha(
        item.produtoId,
        item.variacaoMedida_cm
      );
      const descontoProdutoDestaque = descontos[item.produtoId] || 0;
      const descontoPercentual = Math.max(descontoLinha || 0, descontoProdutoDestaque);

      const precoAtual = descontoPercentual > 0
        ? precoBase * (1 - descontoPercentual / 100)
        : precoBase;

      const precoAnterior = Number(item.previewPrecoUnit) || 0;
      const diferencaPercentual = precoAnterior > 0
        ? Math.abs((precoAtual - precoAnterior) / precoAnterior) * 100
        : 0;

      // Se o preço mudou mais de 5%, remover o item
      if (diferencaPercentual > 5) {
        itensRemovidos.push(item.id);
        continue;
      }

      // Se o preço mudou menos de 5%, atualizar o preço
      if (diferencaPercentual > 0.01) {
        await prisma.carrinhoItem.update({
          where: { id: item.id },
          data: { previewPrecoUnit: Number(precoAtual.toFixed(2)) },
        });
        itensAtualizados.push({
          id: item.id,
          precoAnterior,
          precoNovo: precoAtual,
        });
      }
    }

    // Remover itens inválidos
    if (itensRemovidos.length > 0) {
      await prisma.carrinhoItem.deleteMany({
        where: { id: { in: itensRemovidos } },
      });
    }

    return ok({
      validado: true,
      itensRemovidos: itensRemovidos.length,
      itensAtualizados: itensAtualizados.length,
      mensagem: itensRemovidos.length > 0
        ? `${itensRemovidos.length} produto(s) foram removidos do carrinho por não estarem mais disponíveis ou terem alterações de preço.`
        : itensAtualizados.length > 0
        ? `${itensAtualizados.length} produto(s) tiveram seus preços atualizados.`
        : "Carrinho validado com sucesso.",
    });
  } catch (error: any) {
    console.error("[VALIDAR CART ERROR]:", error);
    return serverError();
  }
}


