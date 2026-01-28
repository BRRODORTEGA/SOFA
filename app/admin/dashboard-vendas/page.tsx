"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type DashboardVendasData = {
  mesReferencia?: string;
  vendasMensais: { mes: string; valor: number; quantidade: number }[];
  top10Produtos: { nome: string; valor: number; quantidade: number }[];
  top5Familias: { nome: string; valor: number; quantidade: number }[];
  top3Categorias: { nome: string; valor: number; quantidade: number }[];
  top5Tecidos: { nome: string; valor: number; quantidade: number }[];
  funilStatus: { status: string; quantidade: number; valor: number }[];
};

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const CORES = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16", "#f97316"];
const CORES_PIE = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNum(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export default function DashboardVendasPage() {
  const [data, setData] = useState<DashboardVendasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [mesRef, setMesRef] = useState<string>(() => mesAtual());
  const [dataDe, setDataDe] = useState<string>("");
  const [dataAte, setDataAte] = useState<string>("");

  useEffect(() => {
    async function load() {
      setErroMsg(null);
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (dataDe && dataAte) {
          params.set("de", dataDe);
          params.set("ate", dataAte);
        } else {
          params.set("mes", mesRef);
        }
        const url = `/api/admin/dashboard-vendas?${params.toString()}`;
        const res = await fetch(url, { credentials: "include" });
        const contentType = res.headers.get("content-type") ?? "";
        const isJson = contentType.includes("application/json");

        if (!res.ok) {
          if (isJson) {
            const json = await res.json().catch(() => ({}));
            throw new Error(json?.error ?? `Erro ${res.status}`);
          }
          throw new Error(`Erro ao carregar dados (${res.status})`);
        }

        if (!isJson) {
          throw new Error("Resposta inválida do servidor. Faça login novamente.");
        }

        const json = await res.json();
        if (json?.error) {
          throw new Error(json.error);
        }
        if (!Array.isArray(json?.vendasMensais)) {
          throw new Error("Dados retornados em formato inesperado.");
        }
        setData(json);
      } catch (e) {
        console.error(e);
        setErroMsg(e instanceof Error ? e.message : "Erro ao carregar dados do dashboard.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [mesRef, dataDe, dataAte]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-600">Carregando dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <p className="text-center text-red-600">
          {erroMsg ?? "Erro ao carregar dados do dashboard."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const labelMesRef = mesRef
    ? new Date(mesRef + "-01").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "";
  const usaEntreDatas = Boolean(dataDe && dataAte);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Vendas</h1>
          <p className="mt-1 text-gray-600">
            Vendas mensais, top produtos, famílias, categorias, tecidos e funil por status
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="mes-ref" className="text-sm font-medium text-gray-700">
              Mês de referência:
            </label>
            <input
              id="mes-ref"
              type="month"
              value={mesRef}
              onChange={(e) => setMesRef(e.target.value)}
              disabled={loading || usaEntreDatas}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
            />
            {!usaEntreDatas && labelMesRef && (
              <span className="text-sm text-gray-500" aria-hidden>
                ({labelMesRef})
              </span>
            )}
          </div>
          <div className="h-px w-px self-stretch bg-gray-200 md:hidden" aria-hidden />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Entre datas:</span>
            <label htmlFor="data-de" className="sr-only">
              De
            </label>
            <input
              id="data-de"
              type="date"
              value={dataDe}
              onChange={(e) => setDataDe(e.target.value)}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
            />
            <span className="text-sm text-gray-500">até</span>
            <label htmlFor="data-ate" className="sr-only">
              Até
            </label>
            <input
              id="data-ate"
              type="date"
              value={dataAte}
              onChange={(e) => setDataAte(e.target.value)}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
            />
            {usaEntreDatas && (
              <button
                type="button"
                onClick={() => {
                  setDataDe("");
                  setDataAte("");
                }}
                className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm text-gray-600 hover:bg-gray-50"
                title="Usar só mês de referência"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Vendas mensais */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Vendas Mensais</h2>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.vendasMensais} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === "valor" ? [formatMoney(value), "Valor"] : [formatNum(value), "Pedidos"]
                }
                labelFormatter={(label) => label}
              />
              <Legend />
              <Bar dataKey="valor" name="Valor (R$)" fill={CORES[0]} radius={[4, 4, 0, 0]} />
              <Bar dataKey="quantidade" name="Qtd. pedidos" fill={CORES[1]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 produtos */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Top 10 Produtos (por valor)</h2>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...data.top10Produtos].reverse()}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 100, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tickFormatter={(v) => formatMoney(v)} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="nome" width={96} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [formatMoney(value), "Valor"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Bar dataKey="valor" name="Valor" fill={CORES[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Linha: Top 5 famílias | Top 3 categorias | Top 5 tecidos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top 5 Famílias</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.top5Familias}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(p) => {
                    const e = p as unknown as { nome?: string; valor?: number };
                    return `${e.nome ?? ""}: ${formatMoney(e.valor ?? 0)}`;
                  }}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {data.top5Familias.map((_, i) => (
                    <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMoney(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top 3 Categorias</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.top3Categorias}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(p) => {
                    const e = p as unknown as { nome?: string; valor?: number };
                    return `${e.nome ?? ""}: ${formatMoney(e.valor ?? 0)}`;
                  }}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {data.top3Categorias.map((_, i) => (
                    <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMoney(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Top 5 Tecidos</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.top5Tecidos}
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(p) => {
                    const e = p as unknown as { nome?: string; valor?: number };
                    return `${e.nome ?? ""}: ${formatMoney(e.valor ?? 0)}`;
                  }}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {data.top5Tecidos.map((_, i) => (
                    <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatMoney(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Funil: quantidade e valor por status */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Funil por status do pedido (quantidade e valor)
        </h2>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.funilStatus}
              margin={{ top: 12, right: 12, left: 0, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="status"
                angle={-35}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis yAxisId="qtd" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="valor" orientation="right" tickFormatter={(v) => formatMoney(v)} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, name: string) =>
                  name === "quantidade" ? [formatNum(value), "Qtd. pedidos"] : [formatMoney(value), "Valor"]
                }
                labelFormatter={(label) => label}
              />
              <Legend />
              <Bar
                yAxisId="qtd"
                dataKey="quantidade"
                name="Quantidade de pedidos"
                fill={CORES[0]}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="valor"
                dataKey="valor"
                name="Valor total (R$)"
                fill={CORES[1]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Tabela resumo do funil */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-gray-600">
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium text-right">Qtd. pedidos</th>
                <th className="pb-2 font-medium text-right">Valor total</th>
              </tr>
            </thead>
            <tbody>
              {data.funilStatus.map((row) => (
                <tr key={row.status} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium text-gray-900">{row.status}</td>
                  <td className="py-2 pr-4 text-right text-gray-700">{formatNum(row.quantidade)}</td>
                  <td className="py-2 text-right font-medium text-gray-900">{formatMoney(row.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
