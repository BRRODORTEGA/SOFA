"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { OrderStatusTracker } from "@/components/storefront/OrderStatusTracker";

type Pedido = {
  id: string;
  codigo: string;
  status: string;
  createdAt: string;
  cliente: { name: string | null; email: string };
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

export default function PedidoAdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const { register: registerStatus, handleSubmit: handleSubmitStatus } = useForm<{ novoStatus: string; motivo?: string }>();
  const { register: registerMsg, handleSubmit: handleSubmitMsg, reset } = useForm<{ texto: string }>();

  useEffect(() => {
    loadPedido();
  }, [params.id]);

  async function loadPedido() {
    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setPedido(data.data.pedido);
        setMensagens(data.data.mensagens);
        
        // Marcar o pedido como visualizado pelo admin quando acessa a página
        // Aguardar a resposta para garantir que foi marcado
        try {
          await fetch(`/api/admin/pedidos/${params.id}/marcar-visualizado`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Erro ao marcar pedido como visualizado:", error);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
    } finally {
      setLoading(false);
    }
  }

  async function onUpdateStatus(data: { novoStatus: string; motivo?: string }) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        loadPedido();
        alert("Status atualizado com sucesso!");
      } else {
        alert("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status");
    } finally {
      setSaving(false);
    }
  }

  async function onSendMessage(data: { texto: string }) {
    setSending(true);
    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}/mensagens`, {
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

  function startEditMessage(msg: Mensagem) {
    setEditingMsgId(msg.id);
    setEditText(msg.texto);
  }

  function cancelEdit() {
    setEditingMsgId(null);
    setEditText("");
  }

  async function saveEditMessage() {
    if (!editingMsgId || !editText.trim()) return;

    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}/mensagens/${editingMsgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: editText.trim() }),
      });

      if (res.ok) {
        setEditingMsgId(null);
        setEditText("");
        loadPedido();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao editar mensagem");
      }
    } catch (error) {
      console.error("Erro ao editar mensagem:", error);
      alert("Erro ao editar mensagem");
    }
  }

  async function deleteMessage(msgId: string) {
    if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return;

    try {
      const res = await fetch(`/api/admin/pedidos/${params.id}/mensagens/${msgId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadPedido();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir mensagem");
      }
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
      alert("Erro ao excluir mensagem");
    }
  }

  if (loading) {
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
      Expedido: "bg-indigo-100 text-indigo-800", // Compatibilidade com status antigo
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{pedido.codigo}</h1>
          <p className="text-sm text-gray-600">
            Cliente: {pedido.cliente.name || pedido.cliente.email} | Criado em{" "}
            {new Date(pedido.createdAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <span className={`rounded-full px-4 py-2 font-medium ${getStatusColor(pedido.status)}`}>
          {pedido.status}
        </span>
      </div>

      {/* Rastreamento de Status */}
      <div className="mb-6 rounded border bg-white p-6">
        <OrderStatusTracker
          currentStatus={pedido.status}
          historico={pedido.historico.map((h) => ({
            status: h.status,
            createdAt: h.createdAt,
          }))}
        />
      </div>

      <div className="mb-6 rounded border p-6">
        <h2 className="mb-4 font-semibold">Atualizar Status</h2>
        <form onSubmit={handleSubmitStatus(onUpdateStatus)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Novo Status</label>
            <select
              {...registerStatus("novoStatus", { required: true })}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="Solicitado">Pedido Solicitado</option>
              <option value="Aprovado">Aprovado</option>
              <option value="Aguardando Pagamento">Aguardando Pagamento</option>
              <option value="Pagamento Aprovado">Pagamento Aprovado</option>
              <option value="Em Produção">Em Produção</option>
              <option value="Em Expedição">Em Expedição</option>
              <option value="Em Transporte">Em Transporte</option>
              <option value="Entregue">Entregue</option>
              <option value="Reprovado">Reprovado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Motivo (opcional)</label>
            <textarea
              {...registerStatus("motivo")}
              className="mt-1 w-full rounded border px-3 py-2"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Atualizar Status"}
          </button>
        </form>
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

      <div className="mb-8 rounded border p-6">
        <h2 className="mb-4 font-semibold">Histórico de Status</h2>
        <div className="space-y-2">
          {pedido.historico.map((h) => (
            <div key={h.id} className="flex items-center gap-3 text-sm">
              <span className="font-medium">{h.status}</span>
              <span className="text-gray-500">{new Date(h.createdAt).toLocaleString("pt-BR")}</span>
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
              className={`rounded p-2 relative group ${
                msg.role === "CLIENTE"
                  ? "bg-secondary"
                  : msg.role === "ADMIN" || msg.role === "OPERADOR"
                    ? "bg-gray-50"
                    : "bg-green-50"
              }`}
            >
              <div className="flex justify-between items-start text-xs text-gray-600">
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
                <div className="flex items-center gap-2">
                  <span>{new Date(msg.createdAt).toLocaleString("pt-BR")}</span>
                  {(msg.role === "ADMIN" || msg.role === "OPERADOR") && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingMsgId === msg.id ? (
                        <>
                          <button
                            onClick={saveEditMessage}
                            className="text-green-600 hover:text-green-800"
                            title="Salvar"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-800"
                            title="Cancelar"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditMessage(msg)}
                            className="text-primary hover:text-domux-burgundy-dark"
                            title="Editar"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {editingMsgId === msg.id ? (
                <div className="mt-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                    rows={3}
                    autoFocus
                  />
                </div>
              ) : (
                <p className="mt-1">{msg.texto}</p>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmitMsg(onSendMessage)} className="flex gap-2">
          <input
            {...registerMsg("texto", { required: true })}
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

