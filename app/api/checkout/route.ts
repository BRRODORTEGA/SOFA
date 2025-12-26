import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";
import { getPrecoUnitario, getDescontoPercentualLinha } from "@/lib/pricing";
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
      include: { 
        itens: true,
        // cupom: true, // Temporariamente desabilitado até migração
      },
    });

    if (!carrinho || carrinho.itens.length === 0) {
      return new Response("Carrinho vazio", { status: 400 });
    }

    const codigo = gerarCodigoPedido();

    // Buscar configurações do site para validar produtos ativos
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

    // Validar e filtrar itens do carrinho conforme tabela vigente
    const itensValidos = [];
    const itensRemovidos = [];
    
    for (const it of carrinho.itens) {
      // Verificar se o produto está na lista de produtos ativos da tabela vigente
      if (produtosAtivos.length > 0 && !produtosAtivos.includes(it.produtoId)) {
        itensRemovidos.push(it.id);
        continue; // Pular este item - não está mais ativo
      }

      // Verificar se o preço ainda está disponível
      const precoBase = await getPrecoUnitario(it.produtoId, it.variacaoMedida_cm, it.tecidoId);
      
      if (precoBase === null) {
        itensRemovidos.push(it.id);
        continue; // Pular este item - preço não disponível
      }

      // Buscar desconto atual da linha da tabela de preço
      const descontoLinha = await getDescontoPercentualLinha(
        it.produtoId,
        it.variacaoMedida_cm
      );

      // Buscar desconto atual do produto em destaque
      const descontoProdutoDestaque = descontos[it.produtoId] || 0;
      
      // Usar o maior desconto entre linha e produto em destaque
      const descontoPercentual = Math.max(descontoLinha || 0, descontoProdutoDestaque);
      
      const precoUnit = descontoPercentual > 0
        ? precoBase * (1 - descontoPercentual / 100)
        : precoBase;

      // Verificar se o preço mudou significativamente (mais de 5% de diferença)
      const precoAnterior = Number(it.previewPrecoUnit) || 0;
      const diferencaPercentual = precoAnterior > 0 
        ? Math.abs((precoUnit - precoAnterior) / precoAnterior) * 100 
        : 0;

      if (diferencaPercentual > 5) {
        // Preço mudou significativamente - remover do carrinho
        itensRemovidos.push(it.id);
        continue;
      }

      // Item válido - adicionar aos itens válidos
      itensValidos.push({
        produtoId: it.produtoId,
        tecidoId: it.tecidoId,
        variacaoMedida_cm: it.variacaoMedida_cm,
        quantidade: it.quantidade,
        precoUnit: Number(precoUnit.toFixed(2)),
      });
    }

    // Remover itens inválidos do carrinho
    if (itensRemovidos.length > 0) {
      await prisma.carrinhoItem.deleteMany({
        where: {
          id: { in: itensRemovidos },
        },
      });
    }

    // Verificar se ainda há itens válidos após validação
    if (itensValidos.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Seu carrinho foi atualizado. Alguns produtos não estão mais disponíveis ou tiveram alterações de preço. Por favor, revise seu carrinho.",
          itensRemovidos: itensRemovidos.length 
        }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Se alguns itens foram removidos, informar o cliente
    if (itensRemovidos.length > 0 && itensValidos.length < carrinho.itens.length) {
      // Continuar com o checkout, mas informar que alguns itens foram removidos
      console.log(`[CHECKOUT] ${itensRemovidos.length} itens removidos do carrinho durante validação`);
    }

    // Calcular total apenas com itens válidos
    let total = 0;
    const itensData = [];
    for (const item of itensValidos) {
      total += item.precoUnit * item.quantidade;
      itensData.push(item);
    }

    // Calcular desconto do cupom se houver (temporariamente desabilitado)
    let descontoCupom = 0;
    // Temporariamente desabilitado até migração
    // if (carrinho.cupomCodigo && carrinho.cupom) {
    //   const cupom = carrinho.cupom;
    //   
    //   // Verificar valor mínimo se houver
    //   if (cupom.valorMinimo && total < Number(cupom.valorMinimo)) {
    //     return new Response(`O valor mínimo para usar este cupom é R$ ${Number(cupom.valorMinimo).toFixed(2)}`, { status: 400 });
    //   }

    //   if (cupom.descontoPercentual) {
    //     descontoCupom = total * (Number(cupom.descontoPercentual) / 100);
    //   } else if (cupom.descontoFixo) {
    //     descontoCupom = Number(cupom.descontoFixo);
    //   }
    // }

    // Criar pedido sem campos de cupom (até migração ser executada)
    const pedidoData: any = {
      codigo,
      clienteId: user.id,
      status: "Solicitado",
      itens: { createMany: { data: itensData } },
      historico: { create: { status: "Solicitado", userId: user.id } },
    };

    // Tentar adicionar campos de cupom apenas se existirem no banco
    // Isso será habilitado após a migração
    // if (carrinho.cupomCodigo) {
    //   pedidoData.cupomCodigo = carrinho.cupomCodigo;
    // }
    // if (descontoCupom > 0) {
    //   pedidoData.descontoCupom = descontoCupom;
    // }

    const pedido = await prisma.pedido.create({
      data: pedidoData,
      include: { itens: true },
    });

    // Calcular total final antes de usar
    const totalFinal = total - descontoCupom;

    // Incrementar contador de usos do cupom se houver (temporariamente desabilitado)
    // if (carrinho.cupomCodigo && carrinho.cupom) {
    //   await prisma.cupom.update({
    //     where: { codigo: carrinho.cupomCodigo },
    //     data: { usosAtuais: { increment: 1 } },
    //   });
    // }

    // Limpa carrinho
    try {
      // Tentar limpar cupom apenas se a coluna existir (comentado até migração)
      // await prisma.carrinho.update({
      //   where: { id: carrinho.id },
      //   data: { cupomCodigo: null },
      // });
      await prisma.carrinhoItem.deleteMany({ where: { carrinhoId: carrinho.id } });
    } catch (cleanError: any) {
      console.error("[CHECKOUT WARNING] Erro ao limpar carrinho:", cleanError);
      // Continuar mesmo se houver erro ao limpar carrinho
    }

    // E-mails (não bloquear checkout se houver erro no envio)
    try {
      await enviarEmailLog({
        to: user.email,
        subject: `Recebemos seu pedido ${codigo}`,
        template: "order_placed",
        react: OrderPlacedEmail({ name: user.name ?? "Cliente", codigo, total: totalFinal }),
      });

      // Destino fábrica (ajuste para e-mail real da operação)
      const fabricaEmail = "fabrica@seusite.com";
      await enviarEmailLog({
        to: fabricaEmail,
        subject: `Novo pedido ${codigo}`,
        template: "factory_new_order",
      react: FactoryNewOrderEmail({ codigo, itens: pedido.itens }),
    });
    } catch (emailError: any) {
      console.error("[CHECKOUT WARNING] Erro ao enviar emails (não bloqueia checkout):", emailError);
      // Não bloquear o checkout se houver erro no envio de email
    }

    return ok({ pedidoId: pedido.id, codigo, total: totalFinal });
  } catch (e: any) {
    console.error("[CHECKOUT ERROR] Erro ao finalizar pedido:", e);
    console.error("[CHECKOUT ERROR] Mensagem:", e.message);
    console.error("[CHECKOUT ERROR] Stack:", e.stack);
    
    // Retornar mensagem de erro mais detalhada para debug
    return new Response(
      JSON.stringify({ 
        error: e.message || "Erro ao finalizar pedido",
        details: process.env.NODE_ENV === 'development' ? e.stack : undefined
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

