import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";
import { getPrecoUnitario } from "@/lib/pricing";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response("Unauthorized", { status: 401 });

    let carrinho = await prisma.carrinho.findUnique({
      where: { userId: user.id },
      include: {
        itens: {
          include: {
            produto: { select: { id: true, nome: true, imagens: true } },
            tecido: { select: { id: true, nome: true, grade: true } },
          },
        },
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
        const descontoPercentual = descontos[item.produtoId] || 0;
        
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

    return ok({
      ...carrinho,
      itens: itensComPrecoDetalhado,
    });
  } catch {
    return serverError();
  }
}

