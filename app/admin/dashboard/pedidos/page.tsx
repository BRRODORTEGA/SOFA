"use client";

import { useEffect, useState } from "react";
import {
  ComposedChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardData {
  kpis: {
    totalPedidos: number;
    receitaTotal: number;
    pedidosPendentes: number;
    ticketMedio: number;
  };
  receitaVsQuantidade: Array<{
    mes: string;
    receita: number;
    quantidade: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    quantidade: number;
    porcentagem: number;
  }>;
  topCategorias: Array<{
    categoria: string;
    receita: number;
    quantidade: number;
  }>;
  pedidosRecentes: Array<{
    id: string;
    codigo: string;
    cliente: string;
    valor: number;
    status: string;
    data: string;
  }>;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function PainelExecutivoPedidosPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/dashboard/pedidos");
        if (!response.ok) throw new Error("Erro ao carregar dados");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-lg text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-lg text-red-600">Erro ao carregar dados do dashboard</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: "#FFBB28",
      AGUARDANDO_PAGAMENTO: "#FF8042",
      APROVADO: "#00C49F",
      EM_PRODUCAO: "#0088FE",
      CONCLUIDO: "#8884d8",
      CANCELADO: "#FF4444",
    };
    return colors[status] || "#8884d8";
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Painel Executivo de Gestão de Pedidos</h1>
        <p className="mt-2 text-base text-gray-600">
          Visão executiva com métricas, tendências e análises de pedidos
        </p>
      </div>

      {/* KPIs - Top Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatNumber(data.kpis.totalPedidos)}
              </p>
            </div>
            <div className="rounded-full bg-secondary p-4">
              <span className="text-3xl">🛒</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Total</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(data.kpis.receitaTotal)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-4">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pedidos Pendentes</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                {formatNumber(data.kpis.pedidosPendentes)}
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-4">
              <span className="text-3xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {formatCurrency(data.kpis.ticketMedio)}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-4">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos - Middle Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Receita vs Quantidade */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Receita vs Quantidade de Pedidos
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.receitaVsQuantidade}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "receita") {
                    return formatCurrency(value);
                  }
                  return formatNumber(value);
                }}
              />
              <Legend />
              <Bar yAxisId="right" dataKey="quantidade" fill="#8884d8" name="Quantidade" />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="receita"
                stroke="#00C49F"
                strokeWidth={2}
                name="Receita"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuição por Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Distribuição por Status
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.statusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, porcentagem }) =>
                  `${getStatusLabel(status)}: ${porcentagem.toFixed(1)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="quantidade"
              >
                {data.statusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Categorias e Pedidos Recentes - Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Categorias */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Top Categorias por Receita
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.topCategorias} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="categoria" type="category" width={120} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="receita" fill="#0088FE" name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pedidos Recentes */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Pedidos Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Código</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Cliente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Valor</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.pedidosRecentes.map((pedido) => (
                  <tr key={pedido.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {pedido.codigo}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{pedido.cliente}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatCurrency(pedido.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor: `${getStatusColor(pedido.status)}20`,
                          color: getStatusColor(pedido.status),
                        }}
                      >
                        {getStatusLabel(pedido.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

