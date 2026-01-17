import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Buscar estatísticas em paralelo
  const [
    totalPedidos,
    pedidosPendentes,
    pedidosAprovados,
    totalClientes,
    totalProdutos,
    produtosAtivos,
    totalCategorias,
    pedidosAprovadosComItens,
  ] = await Promise.all([
    prisma.pedido.count(),
    prisma.pedido.count({ where: { status: { in: ["PENDENTE", "AGUARDANDO_PAGAMENTO"] } } }),
    prisma.pedido.count({ where: { status: "APROVADO" } }),
    prisma.user.count({ where: { role: "CLIENTE" } }),
    prisma.produto.count(),
    prisma.produto.count({ where: { status: true } }),
    prisma.categoria.count({ where: { ativo: true } }),
    prisma.pedido.findMany({
      where: { status: "APROVADO" },
      include: {
        itens: {
          select: {
            precoUnit: true,
            quantidade: true,
          },
        },
      },
    }),
  ]);

  // Calcular receita total somando os valores dos itens dos pedidos aprovados
  const receitaTotal = pedidosAprovadosComItens.reduce((total, pedido) => {
    const valorPedido = pedido.itens.reduce((soma, item) => {
      return soma + Number(item.precoUnit) * item.quantidade;
    }, 0);
    return total + valorPedido;
  }, 0);

  const receitaFormatada = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(receitaTotal);

  // Buscar pedidos recentes
  const pedidosRecentes = await prisma.pedido.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      cliente: {
        select: {
          name: true,
          email: true,
        },
      },
      itens: {
        select: {
          precoUnit: true,
          quantidade: true,
        },
      },
    },
  });

  const stats = [
    {
      label: "Total de Pedidos",
      value: totalPedidos,
      icon: "🛒",
      color: "bg-primary",
    },
    {
      label: "Pedidos Pendentes",
      value: pedidosPendentes,
      icon: "⏳",
      color: "bg-yellow-500",
    },
    {
      label: "Pedidos Aprovados",
      value: pedidosAprovados,
      icon: "✅",
      color: "bg-green-500",
    },
    {
      label: "Total de Clientes",
      value: totalClientes,
      icon: "👥",
      color: "bg-purple-500",
    },
    {
      label: "Produtos Ativos",
      value: produtosAtivos,
      icon: "📦",
      color: "bg-indigo-500",
    },
    {
      label: "Categorias Ativas",
      value: totalCategorias,
      icon: "📁",
      color: "bg-pink-500",
    },
    {
      label: "Receita Total",
      value: receitaFormatada,
      icon: "💰",
      color: "bg-green-600",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return "bg-yellow-100 text-yellow-800";
      case "AGUARDANDO_PAGAMENTO":
        return "bg-orange-100 text-orange-800";
      case "APROVADO":
        return "bg-green-100 text-green-800";
      case "EM_PRODUCAO":
        return "bg-secondary text-primary";
      case "CONCLUIDO":
        return "bg-gray-100 text-gray-800";
      case "CANCELADO":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDENTE: "Pendente",
      AGUARDANDO_PAGAMENTO: "Aguardando Pagamento",
      APROVADO: "Aprovado",
      EM_PRODUCAO: "Em Produção",
      CONCLUIDO: "Concluído",
      CANCELADO: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Geral</h1>
        <p className="mt-2 text-base text-gray-600">Visão geral do sistema e métricas principais</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`rounded-full p-3 ${stat.color} bg-opacity-10`}>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pedidos Recentes */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Pedidos Recentes</h2>
        {pedidosRecentes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Valor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
                </tr>
              </thead>
              <tbody>
                {pedidosRecentes.map((pedido) => (
                  <tr key={pedido.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {pedido.id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {pedido.cliente?.name || pedido.cliente?.email || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(
                        pedido.itens.reduce(
                          (total, item) => total + Number(item.precoUnit) * item.quantidade,
                          0
                        )
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                          pedido.status
                        )}`}
                      >
                        {getStatusLabel(pedido.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(pedido.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhum pedido encontrado.</p>
        )}
      </div>
    </div>
  );
}

