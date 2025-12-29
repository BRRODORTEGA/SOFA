import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdminSession();

    // Buscar todos os pedidos com seus itens
    const pedidos = await prisma.pedido.findMany({
      include: {
        itens: {
          select: {
            precoUnit: true,
            quantidade: true,
            produto: {
              select: {
                categoria: {
                  select: {
                    nome: true,
                  },
                },
              },
            },
          },
        },
        cliente: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calcular valores dos pedidos
    const pedidosComValor = pedidos.map((pedido) => {
      const valorTotal = pedido.itens.reduce(
        (soma, item) => soma + Number(item.precoUnit) * item.quantidade,
        0
      );
      return {
        ...pedido,
        valorTotal,
      };
    });

    // KPIs
    const totalPedidos = pedidos.length;
    const receitaTotal = pedidosComValor.reduce((soma, p) => soma + p.valorTotal, 0);
    const pedidosPendentes = pedidos.filter(
      (p) => p.status === "PENDENTE" || p.status === "AGUARDANDO_PAGAMENTO"
    ).length;
    const ticketMedio = totalPedidos > 0 ? receitaTotal / totalPedidos : 0;

    // Agrupar por mês para receita vs quantidade
    const receitaVsQuantidadeMap = new Map<string, { receita: number; quantidade: number }>();

    pedidosComValor.forEach((pedido) => {
      const mes = new Date(pedido.createdAt).toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });
      const atual = receitaVsQuantidadeMap.get(mes) || { receita: 0, quantidade: 0 };
      receitaVsQuantidadeMap.set(mes, {
        receita: atual.receita + pedido.valorTotal,
        quantidade: atual.quantidade + 1,
      });
    });

    const receitaVsQuantidade = Array.from(receitaVsQuantidadeMap.entries())
      .map(([mes, dados]) => ({
        mes,
        receita: dados.receita,
        quantidade: dados.quantidade,
      }))
      .sort((a, b) => {
        // Ordenar por data
        const dateA = new Date(a.mes + " 01");
        const dateB = new Date(b.mes + " 01");
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-12); // Últimos 12 meses

    // Distribuição por status
    const statusCount = new Map<string, number>();
    pedidos.forEach((pedido) => {
      const atual = statusCount.get(pedido.status) || 0;
      statusCount.set(pedido.status, atual + 1);
    });

    const statusBreakdown = Array.from(statusCount.entries()).map(([status, quantidade]) => ({
      status,
      quantidade,
      porcentagem: totalPedidos > 0 ? (quantidade / totalPedidos) * 100 : 0,
    }));

    // Top categorias por receita
    const categoriasMap = new Map<
      string,
      { receita: number; quantidade: number; categoria: string }
    >();

    pedidosComValor.forEach((pedido) => {
      pedido.itens.forEach((item) => {
        const categoriaNome = item.produto.categoria?.nome || "Sem Categoria";
        const atual = categoriasMap.get(categoriaNome) || {
          receita: 0,
          quantidade: 0,
          categoria: categoriaNome,
        };
        categoriasMap.set(categoriaNome, {
          receita: atual.receita + Number(item.precoUnit) * item.quantidade,
          quantidade: atual.quantidade + item.quantidade,
          categoria: categoriaNome,
        });
      });
    });

    const topCategorias = Array.from(categoriasMap.values())
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 10)
      .map((cat) => ({
        categoria: cat.categoria,
        receita: cat.receita,
        quantidade: cat.quantidade,
      }));

    // Pedidos recentes
    const pedidosRecentes = pedidosComValor.slice(0, 10).map((pedido) => ({
      id: pedido.id,
      codigo: pedido.codigo,
      cliente: pedido.cliente?.name || pedido.cliente?.email || "N/A",
      valor: pedido.valorTotal,
      status: pedido.status,
      data: new Date(pedido.createdAt).toLocaleDateString("pt-BR"),
    }));

    return NextResponse.json({
      kpis: {
        totalPedidos,
        receitaTotal,
        pedidosPendentes,
        ticketMedio,
      },
      receitaVsQuantidade,
      statusBreakdown,
      topCategorias,
      pedidosRecentes,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}


