"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type CarrinhoItem = {
  id: string;
  produto: { id: string; nome: string; imagens: string[] };
  tecido: { id: string; nome: string; grade: string };
  variacaoMedida_cm: number;
  quantidade: number;
  previewPrecoUnit: number | null | string; // Preço com desconto aplicado
  precoOriginal?: number; // Preço original sem desconto
  descontoPercentual?: number | null; // Percentual de desconto
  descontoValor?: number; // Valor do desconto em reais
};

type Carrinho = {
  id: string;
  itens: CarrinhoItem[];
};

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pedidoCodigo, setPedidoCodigo] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/cart&message=login_required");
      return;
    }

    if (status === "authenticated") {
      loadCarrinho();
    }
  }, [status, router]);

  async function loadCarrinho() {
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setCarrinho(data.data);
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantidade(itemId: string, quantidade: number) {
    if (quantidade < 1) return;

    try {
      const res = await fetch("/api/cart/items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantidade }),
      });

      if (res.ok) {
        loadCarrinho();
      }
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
    }
  }

  async function removeItem(itemId: string) {
    try {
      const res = await fetch(`/api/cart/items?id=${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        loadCarrinho();
      }
    } catch (error) {
      console.error("Erro ao remover item:", error);
    }
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setPedidoCodigo(data.data.codigo || null);
        setShowSuccessModal(true);
      } else {
        alert("Erro ao finalizar pedido: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      alert("Erro ao finalizar pedido");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function handleCloseModal() {
    setShowSuccessModal(false);
    router.push("/meus-pedidos");
  }

  if (status === "loading" || loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  if (!carrinho || carrinho.itens.length === 0) {
    return (
      <div className="p-8 text-center">
        <h1 className="mb-4 text-2xl font-semibold">Carrinho vazio</h1>
        <p className="mb-6 text-gray-600">Adicione produtos ao carrinho para continuar.</p>
        <Link href="/" className="rounded bg-black px-4 py-2 text-white">
          Continuar comprando
        </Link>
      </div>
    );
  }

  // Função auxiliar para garantir que o preço seja sempre um número
  const parsePreco = (preco: number | null | string | undefined): number => {
    if (preco === null || preco === undefined) return 0;
    const num = typeof preco === 'string' ? parseFloat(preco) : preco;
    return isNaN(num) ? 0 : num;
  };

  // Calcular totais
  const subtotalSemDesconto = carrinho.itens.reduce((acc, item) => {
    const precoOriginal = item.precoOriginal || parsePreco(item.previewPrecoUnit);
    return acc + precoOriginal * item.quantidade;
  }, 0);

  const totalDesconto = carrinho.itens.reduce((acc, item) => {
    const descontoValor = item.descontoValor || 0;
    return acc + descontoValor * item.quantidade;
  }, 0);

  const totalComDesconto = carrinho.itens.reduce((acc, item) => {
    const preco = parsePreco(item.previewPrecoUnit);
    return acc + preco * item.quantidade;
  }, 0);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Carrinho de Compras</h1>

      <div className="space-y-4">
        {carrinho.itens.map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded border p-4">
            {item.produto.imagens[0] && (
              <img src={item.produto.imagens[0]} alt={item.produto.nome} className="h-20 w-20 rounded object-cover" />
            )}
            <div className="flex-1">
              <h3 className="font-medium">{item.produto.nome}</h3>
              <p className="text-sm text-gray-600">
                Medida: {item.variacaoMedida_cm}cm | Tecido: {item.tecido.nome} ({item.tecido.grade})
              </p>
              <div className="mt-1">
                {item.descontoPercentual && item.descontoPercentual > 0 && item.precoOriginal ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm text-gray-500 line-through">
                      R$ {item.precoOriginal.toFixed(2)}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      -{item.descontoPercentual}%
                    </span>
                    <span className="font-semibold text-red-600">
                      R$ {parsePreco(item.previewPrecoUnit).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <p className="font-semibold">R$ {parsePreco(item.previewPrecoUnit).toFixed(2)}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantidade(item.id, item.quantidade - 1)}
                className="rounded border px-2 py-1"
              >
                -
              </button>
              <span className="w-12 text-center">{item.quantidade}</span>
              <button
                onClick={() => updateQuantidade(item.id, item.quantidade + 1)}
                className="rounded border px-2 py-1"
              >
                +
              </button>
            </div>
            <div className="text-right">
              {item.descontoPercentual && item.descontoPercentual > 0 && item.precoOriginal ? (
                <div>
                  <p className="text-sm text-gray-500 line-through">
                    R$ {(item.precoOriginal * item.quantidade).toFixed(2)}
                  </p>
                  <p className="font-semibold text-red-600">
                    R$ {(parsePreco(item.previewPrecoUnit) * item.quantidade).toFixed(2)}
                  </p>
                </div>
              ) : (
                <p className="font-semibold">R$ {(parsePreco(item.previewPrecoUnit) * item.quantidade).toFixed(2)}</p>
              )}
              <button onClick={() => removeItem(item.id)} className="mt-2 text-sm text-red-600 hover:underline">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded border bg-gray-50 p-6">
        <div className="space-y-2">
          <div className="flex justify-between text-base text-gray-700">
            <span>Subtotal:</span>
            <span>R$ {subtotalSemDesconto.toFixed(2)}</span>
          </div>
          {totalDesconto > 0 && (
            <div className="flex justify-between text-base text-red-600">
              <span>Desconto aplicado:</span>
              <span className="font-semibold">-R$ {totalDesconto.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-4 flex justify-between border-t border-gray-300 pt-4 text-lg font-semibold">
            <span>Total:</span>
            <span className={totalDesconto > 0 ? "text-red-600" : ""}>
              R$ {totalComDesconto.toFixed(2)}
            </span>
          </div>
        </div>
        <button
          onClick={handleCheckout}
          disabled={checkoutLoading}
          className="mt-6 w-full rounded bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {checkoutLoading ? "Processando..." : "Finalizar Pedido"}
        </button>
      </div>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h2 className="mb-4 text-center text-2xl font-bold text-gray-900">
              Pedido Enviado com Sucesso!
            </h2>
            {pedidoCodigo && (
              <p className="mb-4 text-center text-sm text-gray-600">
                Código do pedido: <span className="font-semibold text-gray-900">{pedidoCodigo}</span>
              </p>
            )}
            <div className="mb-6 space-y-3 text-sm text-gray-700">
              <p className="text-center">
                Seu pedido foi enviado para <strong>aprovação</strong> e em breve você receberá as informações para dar sequência no pagamento.
              </p>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="mb-2 font-medium text-blue-900">Como acompanhar seu pedido:</p>
                <ul className="space-y-1 text-blue-800">
                  <li className="flex items-start gap-2">
                    <span>📧</span>
                    <span>Acompanhe seu e-mail para receber atualizações</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>📋</span>
                    <span>Visite a seção "Meus Pedidos" no site</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                Ver Meus Pedidos
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push("/");
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

