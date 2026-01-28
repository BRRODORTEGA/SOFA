"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { OrderStatusTracker } from "@/components/storefront/OrderStatusTracker";

type Pedido = {
  id: string;
  codigo: string;
  status: string;
  createdAt: string;
  itens: Array<{
    id: string;
    produto: { nome: string; imagens: string[] };
    tecido: { nome: string; grade: string };
    variacaoMedida_cm: number;
    quantidade: number;
    precoUnit: number;
  }>;
  historico: Array<{
    id: string;
    status: string;
    reason: string | null;
    createdAt: string;
  }>;
};

type Mensagem = {
  id: string;
  texto: string;
  role: string | null;
  createdAt: string;
  editada?: boolean;
  editadaEm?: string;
  excluida?: boolean;
  excluidaEm?: string;
};

export default function PedidoDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ texto: string }>();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      loadPedido();
    }
  }, [status, router, params.id]);

  async function loadPedido() {
    try {
      const res = await fetch(`/api/meus-pedidos/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPedido(data.data.pedido);
        setMensagens(data.data.mensagens);

        // Marcar este pedido como visualizado ao abrir a página — a sinalização será removida
        const marcarRes = await fetch("/api/meus-pedidos/marcar-visualizado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pedidoId: params.id }),
        });
        if (marcarRes.ok) {
          window.dispatchEvent(new CustomEvent("pedidos-visualizados"));
        }
      }
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onSendMessage(data: { texto: string }) {
    setSending(true);
    try {
      const res = await fetch(`/api/meus-pedidos/${params.id}/mensagens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        reset();
        loadPedido();
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setSending(false);
    }
  }

  if (status === "loading" || loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!pedido) {
    return <div className="p-8 text-center">Pedido não encontrado</div>;
  }

  const total = pedido.itens.reduce((acc, item) => {
    return acc + Number(item.precoUnit) * item.quantidade;
  }, 0);

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
        <div>
          <h1 className="text-2xl font-semibold">{pedido.codigo}</h1>
          <p className="text-sm text-gray-600">
            Criado em {new Date(pedido.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <span className={`rounded-full px-4 py-2 font-medium ${getStatusColor(pedido.status)}`}>
          {pedido.status}
        </span>
      </div>

      <div className="mb-8 rounded border p-6">
        <h2 className="mb-4 font-semibold">Itens do Pedido</h2>
        <div className="space-y-3">
          {pedido.itens.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border-b pb-3">
              {item.produto.imagens[0] && (
                <img src={item.produto.imagens[0]} alt={item.produto.nome} className="h-16 w-16 rounded object-cover" />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.produto.nome}</p>
                <p className="text-sm text-gray-600">
                  {item.variacaoMedida_cm}cm | {item.tecido.nome} ({item.tecido.grade}) | Qtd: {item.quantidade}
                </p>
              </div>
              <p className="font-semibold">R$ {(Number(item.precoUnit) * item.quantidade).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t pt-4 text-lg font-semibold">
          <span>Total:</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>

      {/* Rastreamento de Status */}
      <div className="mb-8 rounded border bg-white p-6">
        <OrderStatusTracker
          currentStatus={pedido.status}
          historico={pedido.historico.map((h) => ({
            status: h.status,
            createdAt: h.createdAt,
          }))}
        />
      </div>

      <div className="mb-8 rounded border p-6">
        <h2 className="mb-4 font-semibold">Histórico de Status</h2>
        <div className="space-y-2">
          {pedido.historico.map((h) => (
            <div key={h.id} className="flex items-center gap-3 text-sm">
              <span className="font-medium">{h.status}</span>
              <span className="text-gray-500">
                {new Date(h.createdAt).toLocaleString("pt-BR")}
              </span>
              {h.reason && <span className="text-gray-600">- {h.reason}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded border p-6">
        <h2 className="mb-4 font-semibold">Mensagens</h2>
        <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
          {mensagens.map((msg) => (
            <div
              key={msg.id}
              className={`rounded p-2 ${
                msg.role === "CLIENTE" ? "bg-secondary" : msg.role === "ADMIN" || msg.role === "OPERADOR" ? "bg-gray-50" : "bg-green-50"
              }`}
            >
              <div className="flex justify-between text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span>{msg.role || "Sistema"}</span>
                  {msg.editada && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800" title={`Editada em ${msg.editadaEm ? new Date(msg.editadaEm).toLocaleString("pt-BR") : ''}`}>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editada
                    </span>
                  )}
                </div>
                <span>{new Date(msg.createdAt).toLocaleString("pt-BR")}</span>
              </div>
              <p className="mt-1">{msg.texto}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit(onSendMessage)} className="flex gap-2">
          <input
            {...register("texto", { required: true })}
            className="flex-1 rounded border px-3 py-2"
            placeholder="Digite sua mensagem..."
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}

