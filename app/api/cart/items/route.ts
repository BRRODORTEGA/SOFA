import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";
import { getPrecoUnitario, getDescontoPercentualLinha } from "@/lib/pricing";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response("Unauthorized", { status: 401 });

    const body = await req.json();
    const { produtoId, tecidoId, variacaoMedida_cm, quantidade, lado } = body;
    
    console.log("[CART ITEMS] Dados recebidos:", { produtoId, tecidoId, variacaoMedida_cm, quantidade, lado });
    
    if (!produtoId || !tecidoId || variacaoMedida_cm === undefined || variacaoMedida_cm === null || !quantidade) {
      const missingFields = [];
      if (!produtoId) missingFields.push("produtoId");
      if (!tecidoId) missingFields.push("tecidoId");
      if (variacaoMedida_cm === undefined || variacaoMedida_cm === null) missingFields.push("variacaoMedida_cm");
      if (!quantidade) missingFields.push("quantidade");
      
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: `Campos obrigatórios faltando: ${missingFields.join(", ")}`,
          received: body
        }),
        { 
          status: 422,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const carrinho = await prisma.carrinho.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const precoBase = await getPrecoUnitario(produtoId, Number(variacaoMedida_cm), tecidoId);
    console.log("[CART ITEMS] Preço base encontrado:", precoBase);
    
    if (precoBase === null) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: "Preço não disponível para esta combinação de produto, medida e tecido. Por favor, verifique se a combinação está cadastrada na tabela de preços.",
          produtoId,
          variacaoMedida_cm: Number(variacaoMedida_cm),
          tecidoId
        }),
        { 
          status: 422,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Buscar desconto da linha da tabela de preço
    const descontoLinha = await getDescontoPercentualLinha(
      produtoId,
      Number(variacaoMedida_cm)
    );

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
    
    // Aplicar desconto se houver
    const previewPrecoUnit = descontoPercentual > 0
      ? precoBase * (1 - descontoPercentual / 100)
      : precoBase;

    // Verificar se o produto possui lados e validar lado se necessário
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      select: { possuiLados: true },
    });

    if (produto?.possuiLados && !lado) {
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: "O lado (esquerdo ou direito) é obrigatório para este produto.",
        }),
        { 
          status: 422,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Verificar se já existe um item igual no carrinho (incluindo lado se aplicável)
    const whereClause: any = {
      carrinhoId: carrinho.id,
      produtoId,
      tecidoId,
      variacaoMedida_cm: Number(variacaoMedida_cm),
    };

    // Incluir lado apenas se o produto possui lados
    if (produto?.possuiLados) {
      whereClause.lado = lado;
    } else {
      // Quando não possui lados, garantir que o lado seja null
      whereClause.lado = null;
    }

    const itemExistente = await prisma.carrinhoItem.findFirst({
      where: whereClause,
    });

    console.log("[CART ITEMS] Item existente encontrado:", itemExistente ? "Sim" : "Não");

    let item;
    try {
      if (itemExistente) {
        // Se já existe, atualizar a quantidade
        console.log("[CART ITEMS] Atualizando item existente:", itemExistente.id);
        item = await prisma.carrinhoItem.update({
          where: { id: itemExistente.id },
          data: {
            quantidade: itemExistente.quantidade + Number(quantidade),
            previewPrecoUnit: Number(previewPrecoUnit.toFixed(2)),
          },
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
        });
      } else {
        // Se não existe, criar novo item
        console.log("[CART ITEMS] Criando novo item no carrinho");
        const itemData: any = {
          carrinhoId: carrinho.id,
          produtoId,
          tecidoId,
          variacaoMedida_cm: Number(variacaoMedida_cm),
          quantidade: Number(quantidade),
          previewPrecoUnit: Number(previewPrecoUnit.toFixed(2)),
        };

        // Incluir lado apenas se o produto possui lados
        if (produto?.possuiLados) {
          itemData.lado = lado;
        } else {
          itemData.lado = null;
        }
        console.log("[CART ITEMS] Dados do item a criar:", itemData);
        
        item = await prisma.carrinhoItem.create({
          data: itemData,
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
        });
      }
      
      console.log("[CART ITEMS] Item processado com sucesso:", item.id);
    } catch (dbError: any) {
      console.error("[CART ITEMS ERROR] Erro no banco de dados:", dbError);
      console.error("[CART ITEMS ERROR] Código do erro:", dbError.code);
      console.error("[CART ITEMS ERROR] Mensagem:", dbError.message);
      
      return new Response(
        JSON.stringify({ 
          ok: false,
          error: `Erro ao salvar item no carrinho: ${dbError.message || "Erro desconhecido"}`,
          code: dbError.code
        }),
        { 
          status: 422,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    return ok(item);
  } catch (e: any) {
    console.error("[CART ITEMS ERROR] Erro ao adicionar item:", e);
    console.error("[CART ITEMS ERROR] Stack:", e.stack);
    
    // Retornar mensagem de erro mais detalhada
    const errorMessage = e.message || "Erro ao adicionar produto ao carrinho";
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? e.stack : undefined
      }),
      { 
        status: 422,
        headers: { "Content-Type": "application/json" }
      }
    );
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

