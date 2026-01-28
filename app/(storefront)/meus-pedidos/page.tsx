"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Pedido = {
  id: string;
  codigo: string;
  status: string;
  createdAt: string;
  itens: any[];
  temAtualizacao?: boolean;
  temNovaMensagem?: boolean;
  temAtualizacaoStatus?: boolean;
};

export default function MeusPedidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAtualizacoes, setTotalAtualizacoes] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/meus-pedidos");
      return;
    }

    if (status === "authenticated") {
      loadPedidos();
    }
  }, [status, router]);

  // Ao visualizar um pedido (na página do pedido), a listagem recarrega para sumir a sinalização
  useEffect(() => {
    const onPedidosVisualizados = () => loadPedidos();
    window.addEventListener("pedidos-visualizados", onPedidosVisualizados);
    return () => window.removeEventListener("pedidos-visualizados", onPedidosVisualizados);
  }, []);

  async function loadPedidos() {
    try {
      const res = await fetch("/api/meus-pedidos");
      if (res.ok) {
        const data = await res.json();
        const pedidosComAtualizacoes = data.data.items;
        
        // Contar total de atualizações
        const total = pedidosComAtualizacoes.filter((p: Pedido) => p.temAtualizacao).length;
        
        // NÃO marcar como visualizado automaticamente - deixar o usuário ver quais pedidos têm atualizações
        // A marcação será feita quando o usuário clicar em um pedido específico
        
        setPedidos(pedidosComAtualizacoes);
        setTotalAtualizacoes(total);
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      Solicitado: "bg-yellow-100 text-yellow-800",
      Aprovado: "bg-secondary text-primary",
      "Aguardando Pagamento": "bg-orange-100 text-orange-800",
      "Pagamento Aprovado": "bg-green-100 text-green-800",
      "Em Produção": "bg-purple-100 text-purple-800",
      "Em Expedição": "bg-indigo-100 text-indigo-800",
      "Em Transporte": "bg-cyan-100 text-cyan-800",
      Entregue: "bg-emerald-100 text-emerald-800",
      Reprovado: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Meus Pedidos</h1>
        {totalAtualizacoes > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
            <span className="text-sm font-medium text-red-800">
              {totalAtualizacoes} {totalAtualizacoes === 1 ? 'atualização' : 'atualizações'}
            </span>
          </div>
        )}
      </div>

      {pedidos.length === 0 ? (
        <div className="rounded border p-8 text-center">
          <p className="text-gray-600">Você ainda não fez nenhum pedido.</p>
          <Link href="/" className="mt-4 inline-block rounded bg-black px-4 py-2 text-white">
            Ver produtos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => {
            const total = pedido.itens.reduce((acc: number, item: any) => {
              return acc + Number(item.precoUnit) * item.quantidade;
            }, 0);
            const temAtualizacao = !!pedido.temAtualizacao;

            return (
              <Link
                key={pedido.id}
                href={`/meus-pedidos/${pedido.id}`}
                className={`block rounded-lg border p-4 hover:bg-gray-50 relative transition-all overflow-hidden ${
                  temAtualizacao
                    ? "border-l-4 border-l-red-500 border-red-200 bg-red-50/50 shadow-sm"
                    : "border-gray-200"
                }`}
              >
                {/* Ponto pulsante e badge quando há atualização */}
                {temAtualizacao && (
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="relative flex h-3 w-3" title="Este pedido tem novidades">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                      </span>
                      <span className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white shadow-sm">
                        {pedido.temNovaMensagem && pedido.temAtualizacaoStatus
                          ? "Nova mensagem e status"
                          : pedido.temNovaMensagem
                          ? "Nova mensagem"
                          : pedido.temAtualizacaoStatus
                          ? "Status atualizado"
                          : "Atualização"}
                      </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${temAtualizacao ? "text-red-800" : "text-gray-900"}`}>
                        {pedido.codigo}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(pedido.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="mt-1 text-sm font-medium">R$ {total.toFixed(2)}</p>
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(pedido.status)}`}>
                    {pedido.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

