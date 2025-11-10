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
  previewPrecoUnit: number | null;
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/cart");
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
        router.push(`/meus-pedidos/${data.data.pedidoId}`);
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

  const total = carrinho.itens.reduce((acc, item) => {
    const preco = item.previewPrecoUnit ?? 0;
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
              <p className="mt-1 font-semibold">R$ {(item.previewPrecoUnit ?? 0).toFixed(2)}</p>
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
              <p className="font-semibold">R$ {((item.previewPrecoUnit ?? 0) * item.quantidade).toFixed(2)}</p>
              <button onClick={() => removeItem(item.id)} className="mt-2 text-sm text-red-600 hover:underline">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded border bg-gray-50 p-6">
        <div className="mb-4 flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
        <button
          onClick={handleCheckout}
          disabled={checkoutLoading}
          className="w-full rounded bg-emerald-600 px-4 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {checkoutLoading ? "Processando..." : "Finalizar Pedido"}
        </button>
      </div>
    </div>
  );
}

