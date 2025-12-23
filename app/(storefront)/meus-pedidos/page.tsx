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

  async function loadPedidos() {
    try {
      const res = await fetch("/api/meus-pedidos");
      if (res.ok) {
        const data = await res.json();
        setPedidos(data.data.items);
        // Contar total de atualizações
        const total = data.data.items.filter((p: Pedido) => p.temAtualizacao).length;
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
      "Aguardando Pagamento": "bg-orange-100 text-orange-800",
      Aprovado: "bg-blue-100 text-blue-800",
      "Em Produção": "bg-purple-100 text-purple-800",
      Expedido: "bg-green-100 text-green-800",
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

            return (
              <Link
                key={pedido.id}
                href={`/meus-pedidos/${pedido.id}`}
                className="block rounded border p-4 hover:bg-gray-50 relative"
              >
                {pedido.temAtualizacao && (
                  <div className="absolute top-2 right-2">
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{pedido.codigo}</h3>
                      {pedido.temAtualizacao && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                          </svg>
                          {pedido.temNovaMensagem && pedido.temAtualizacaoStatus ? 'Nova mensagem e status' :
                           pedido.temNovaMensagem ? 'Nova mensagem' :
                           pedido.temAtualizacaoStatus ? 'Status atualizado' : 'Atualização'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(pedido.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="mt-1 text-sm font-medium">R$ {total.toFixed(2)}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(pedido.status)}`}>
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

