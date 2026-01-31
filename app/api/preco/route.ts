import { getPrecoUnitario, getDescontoPercentualLinha } from "@/lib/pricing";
import { getEstoqueProntaEntrega } from "@/lib/estoque-pronta-entrega";
import { ok, unprocessable, serverError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const produtoId = url.searchParams.get("produtoId");
    const tecidoId = url.searchParams.get("tecidoId");
    const medida = Number(url.searchParams.get("medida"));

    if (!produtoId || !tecidoId || !medida) {
      return unprocessable({ message: "Campos obrigatórios: produtoId, tecidoId, medida" });
    }

    const preco = await getPrecoUnitario(produtoId, medida, tecidoId);
    
    // Se não encontrou o preço, retorna null com flag indicando indisponibilidade
    if (preco === null) {
      return ok({ 
        preco: null, 
        disponivel: false,
        mensagem: "Me avise quando disponível"
      });
    }

    // Buscar desconto da linha da tabela de preço
    const descontoLinha = await getDescontoPercentualLinha(produtoId, medida);

    // Buscar desconto do produto em destaque
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        descontosProdutosDestaque: true,
      },
    }) as any;

    const descontos = (siteConfig?.descontosProdutosDestaque as Record<string, number>) || {};
    const descontoProdutoDestaque = descontos[produtoId] || 0;
    
    // Usar o maior desconto entre linha e produto em destaque
    const descontoPercentual = Math.max(descontoLinha || 0, descontoProdutoDestaque);
    
    const precoOriginal = preco;
    const precoComDesconto = descontoPercentual > 0 
      ? preco * (1 - descontoPercentual / 100)
      : preco;

    // Verificar estoque pronta entrega para a combinação (produto + medida + tecido)
    const estoquePE = await getEstoqueProntaEntrega(produtoId, medida, tecidoId);
    const prontaEntrega = estoquePE !== null && estoquePE >= 1;

    return ok({ 
      preco: precoComDesconto,
      precoOriginal: descontoPercentual > 0 ? precoOriginal : null,
      descontoPercentual: descontoPercentual > 0 ? descontoPercentual : null,
      disponivel: true,
      prontaEntrega,
    });
  } catch (e: any) {
    if (e.message) {
      return unprocessable({ message: e.message });
    }
    return serverError();
  }
}

