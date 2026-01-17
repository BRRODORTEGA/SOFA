import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";
import { getPrecoUnitario, getDescontoPercentualLinha } from "@/lib/pricing";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response("Unauthorized", { status: 401 });

    // Debug: verificar se há itens no carrinho antes de buscar
    const carrinhoSemInclude = await prisma.carrinho.findUnique({
      where: { userId: user.id },
      include: { itens: true },
    });
    
    console.log(`[CART DEBUG] Usuário: ${user.id} (${user.email})`);
    if (carrinhoSemInclude) {
      console.log(`[CART DEBUG] Carrinho encontrado: ${carrinhoSemInclude.id} com ${carrinhoSemInclude.itens.length} itens`);
      if (carrinhoSemInclude.itens.length > 0) {
        console.log(`[CART DEBUG] Itens:`, carrinhoSemInclude.itens.map(i => ({ id: i.id, produtoId: i.produtoId, quantidade: i.quantidade })));
      }
    } else {
      console.log(`[CART DEBUG] Nenhum carrinho encontrado para o usuário`);
    }

    let carrinho = await prisma.carrinho.findUnique({
      where: { userId: user.id },
      include: {
        itens: {
          include: {
            produto: { 
              select: { 
                id: true, 
                nome: true, 
                imagens: true,
                familia: { select: { id: true, nome: true } }
              } 
            },
            tecido: { select: { id: true, nome: true, grade: true } },
          },
        },
        // cupom: true, // Comentado temporariamente até a migração ser executada
      },
    });

    if (!carrinho) {
      carrinho = await prisma.carrinho.create({
        data: { userId: user.id },
        include: {
          itens: {
            include: {
              produto: { select: { id: true, nome: true, imagens: true } },
              tecido: { select: { id: true, nome: true, grade: true } },
            },
          },
          // cupom: true, // Comentado temporariamente até a migração ser executada
        },
      });
    }

    // Buscar descontos configurados
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        descontosProdutosDestaque: true,
      },
    }) as any;

    const descontos = (siteConfig?.descontosProdutosDestaque as Record<string, number>) || {};

    // Enriquecer itens com preços originais e descontos
    const itensComPrecoDetalhado = await Promise.all(
      carrinho.itens.map(async (item) => {
        let precoUnit = item.previewPrecoUnit;
        
        // Converter Decimal do Prisma para número
        if (precoUnit !== null && precoUnit !== undefined) {
          if (typeof precoUnit === 'object' && 'toNumber' in precoUnit) {
            precoUnit = (precoUnit as any).toNumber();
          } else if (typeof precoUnit === 'string') {
            precoUnit = parseFloat(precoUnit);
          }
          precoUnit = Number(precoUnit);
        } else {
          precoUnit = 0;
        }
        
        // Garantir que seja um número válido
        if (isNaN(precoUnit) || precoUnit < 0) {
          precoUnit = 0;
        }

        // Buscar preço original (sem desconto)
        const precoOriginal = await getPrecoUnitario(
          item.produtoId,
          item.variacaoMedida_cm,
          item.tecidoId
        );

        const precoOriginalValido = precoOriginal !== null ? Number(precoOriginal) : precoUnit;
        
        // Buscar desconto da linha da tabela de preço
        const descontoLinha = await getDescontoPercentualLinha(
          item.produtoId,
          item.variacaoMedida_cm
        );
        
        // Buscar desconto do produto em destaque
        const descontoProdutoDestaque = descontos[item.produtoId] || 0;
        
        // Usar o maior desconto entre linha e produto em destaque
        const descontoPercentual = Math.max(descontoLinha || 0, descontoProdutoDestaque);
        
        // Se há desconto, o precoUnit já está com desconto aplicado
        // Calcular o desconto em valor
        const descontoValor = descontoPercentual > 0 && precoOriginalValido > 0
          ? precoOriginalValido - precoUnit
          : 0;

        return {
          ...item,
          previewPrecoUnit: precoUnit,
          precoOriginal: precoOriginalValido,
          descontoPercentual: descontoPercentual > 0 ? descontoPercentual : null,
          descontoValor: descontoValor,
        };
      })
    );

    // Calcular desconto do cupom se houver
    let descontoCupom = 0;
    // Temporariamente desabilitado até a migração ser executada
    // if (carrinho.cupomCodigo && carrinho.cupom) {
    //   const cupom = carrinho.cupom;
    //   const subtotal = itensComPrecoDetalhado.reduce((acc, item) => {
    //     const preco = Number(item.previewPrecoUnit) || 0;
    //     return acc + preco * item.quantidade;
    //   }, 0);

    //   // Verificar valor mínimo se houver
    //   if (!cupom.valorMinimo || subtotal >= Number(cupom.valorMinimo)) {
    //     if (cupom.descontoPercentual) {
    //       descontoCupom = subtotal * (Number(cupom.descontoPercentual) / 100);
    //     } else if (cupom.descontoFixo) {
    //       descontoCupom = Number(cupom.descontoFixo);
    //     }
    //   }
    // }

    return ok({
      ...carrinho,
      itens: itensComPrecoDetalhado,
      descontoCupom,
      cupomCodigo: null, // Temporariamente null até a migração
      cupom: null, // Temporariamente null até a migração
    });
  } catch (error: any) {
    console.error("[CART ERROR] Erro ao buscar carrinho:", error);
    return serverError();
  }
}

