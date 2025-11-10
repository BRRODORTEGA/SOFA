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
};

export default function MeusPedidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

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
      Aprovado: "bg-blue-100 text-blue-800",
      "Em Produção": "bg-purple-100 text-purple-800",
      Expedido: "bg-green-100 text-green-800",
      Reprovado: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Meus Pedidos</h1>

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
                className="block rounded border p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{pedido.codigo}</h3>
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

