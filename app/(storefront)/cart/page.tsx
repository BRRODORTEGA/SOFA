"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type CarrinhoItem = {
  id: string;
  produto: { 
    id: string; 
    nome: string; 
    imagens: string[];
    familia: { id: string; nome: string } | null;
  };
  tecido: { id: string; nome: string; grade: string };
  variacaoMedida_cm: number;
  quantidade: number;
  lado: string | null; // "esquerdo" ou "direito" - apenas quando produto possuiLados = true
  previewPrecoUnit: number | null | string; // Preço com desconto aplicado
  precoOriginal?: number; // Preço original sem desconto
  descontoPercentual?: number | null; // Percentual de desconto
  descontoValor?: number; // Valor do desconto em reais
};

type Cupom = {
  codigo: string;
  descricao?: string | null;
  descontoPercentual?: number | null;
  descontoFixo?: number | null;
  valorMinimo?: number | null;
};

type Carrinho = {
  id: string;
  itens: CarrinhoItem[];
  cupomCodigo?: string | null;
  cupom?: Cupom | null;
  descontoCupom?: number;
};

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pedidoCodigo, setPedidoCodigo] = useState<string | null>(null);
  const [cupomCodigo, setCupomCodigo] = useState("");
  const [cupomLoading, setCupomLoading] = useState(false);
  const [cupomError, setCupomError] = useState<string | null>(null);

  const loadCarrinho = useCallback(async () => {
    try {
      const res = await fetch("/api/cart");
      const data = await res.json();
      
      if (res.ok) {
        console.log("[CART DEBUG] Dados recebidos:", data);
        console.log("[CART DEBUG] Itens no carrinho:", data.data?.itens?.length || 0);
        setCarrinho(data.data);
        if (data.data?.cupomCodigo) {
          setCupomCodigo(data.data.cupomCodigo);
        }
      } else {
        console.error("[CART DEBUG] Erro na resposta:", data);
        alert("Erro ao carregar carrinho: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro ao carregar carrinho:", error);
      alert("Erro ao carregar carrinho. Verifique o console para mais detalhes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/cart&message=login_required");
      return;
    }

    if (status === "authenticated") {
      // Validar carrinho automaticamente ao carregar a página
      fetch("/api/cart/validar", { method: "POST" })
        .then(res => res.json())
        .then(data => {
          if (data.data && (data.data.itensRemovidos > 0 || data.data.itensAtualizados > 0)) {
            // Mostrar notificação discreta
            if (data.data.itensRemovidos > 0) {
              console.log(`[CART] ${data.data.mensagem}`);
            }
          }
          // Sempre recarregar o carrinho após validação
          loadCarrinho();
        })
        .catch(err => {
          console.error("Erro ao validar carrinho:", err);
          // Em caso de erro, ainda assim carregar o carrinho
          loadCarrinho();
        });
    }
  }, [status, router, loadCarrinho]);

  async function aplicarCupom() {
    if (!cupomCodigo.trim()) {
      setCupomError("Digite um código de cupom");
      return;
    }

    setCupomLoading(true);
    setCupomError(null);

    try {
      const res = await fetch("/api/cart/cupom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: cupomCodigo }),
      });

      const data = await res.json();

      if (res.ok) {
        loadCarrinho();
        setCupomCodigo("");
      } else {
        setCupomError(data.error || "Erro ao aplicar cupom");
      }
    } catch (error) {
      console.error("Erro ao aplicar cupom:", error);
      setCupomError("Erro ao aplicar cupom");
    } finally {
      setCupomLoading(false);
    }
  }

  async function removerCupom() {
    setCupomLoading(true);
    setCupomError(null);

    try {
      const res = await fetch("/api/cart/cupom", {
        method: "DELETE",
      });

      if (res.ok) {
        loadCarrinho();
        setCupomCodigo("");
      }
    } catch (error) {
      console.error("Erro ao remover cupom:", error);
      setCupomError("Erro ao remover cupom");
    } finally {
      setCupomLoading(false);
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
      // Primeiro, validar o carrinho antes de finalizar
      const validacaoRes = await fetch("/api/cart/validar", { method: "POST" });
      const validacaoData = await validacaoRes.json();

      if (validacaoRes.ok && validacaoData.data) {
        if (validacaoData.data.itensRemovidos > 0 || validacaoData.data.itensAtualizados > 0) {
          // Recarregar o carrinho para mostrar as mudanças
          await loadCarrinho();
          
          // Mostrar mensagem informativa
          const mensagem = validacaoData.data.mensagem || 
            `${validacaoData.data.itensRemovidos} produto(s) foram removidos. ${validacaoData.data.itensAtualizados} produto(s) tiveram preços atualizados.`;
          
          if (validacaoData.data.itensRemovidos > 0) {
            alert(mensagem + "\n\nPor favor, revise seu carrinho antes de finalizar o pedido.");
            setCheckoutLoading(false);
            return;
          } else {
            alert(mensagem + "\n\nContinuando com o checkout...");
          }
        }
      }

      // Prosseguir com o checkout
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setPedidoCodigo(data.data.codigo || null);
        setShowSuccessModal(true);
      } else {
        // Se o erro contém informações sobre itens removidos, recarregar o carrinho
        if (data.error && data.error.includes("atualizado")) {
          await loadCarrinho();
        }
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

  // Aplicar desconto do cupom se houver
  const descontoCupom = carrinho.descontoCupom || 0;
  const totalFinal = totalComDesconto - descontoCupom;

  // Agrupar itens por família
  const itensAgrupadosPorFamilia = carrinho.itens.reduce((acc, item) => {
    const familiaNome = item.produto.familia?.nome || "Sem Família";
    if (!acc[familiaNome]) {
      acc[familiaNome] = [];
    }
    acc[familiaNome].push(item);
    return acc;
  }, {} as Record<string, CarrinhoItem[]>);

  // Ordenar as famílias alfabeticamente
  const familiasOrdenadas = Object.keys(itensAgrupadosPorFamilia).sort();

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">Carrinho de Compras</h1>

      <div className="space-y-6">
        {familiasOrdenadas.map((familiaNome) => (
          <div key={familiaNome} className="space-y-4">
            {/* Cabeçalho da Família */}
            <div className="border-b border-gray-200 pb-2">
              <h2 className="text-lg font-semibold text-gray-900">{familiaNome}</h2>
            </div>
            
            {/* Itens da Família */}
            <div className="space-y-4">
              {itensAgrupadosPorFamilia[familiaNome].map((item) => (
          <div key={item.id} className="flex items-center gap-4 rounded border p-4">
            {item.produto.imagens[0] && (
              <img src={item.produto.imagens[0]} alt={item.produto.nome} className="h-20 w-20 rounded object-cover" />
            )}
            <div className="flex-1">
              <h3 className="font-medium">{item.produto.nome}</h3>
              <p className="text-sm text-gray-600">
                Medida: {item.variacaoMedida_cm}cm{item.lado && ` | Lado: ${item.lado.charAt(0).toUpperCase() + item.lado.slice(1)}`} | Tecido: {item.tecido.nome} ({item.tecido.grade})
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
          </div>
        ))}
      </div>

      {/* Campo de cupom */}
      <div className="mt-8 rounded border bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold">Cupom de Desconto</h3>
        {carrinho.cupom ? (
          <div className="flex items-center justify-between rounded bg-green-50 p-3">
            <div>
              <p className="font-medium text-green-800">
                Cupom: {carrinho.cupom.codigo}
              </p>
              {carrinho.cupom.descricao && (
                <p className="text-sm text-green-600">{carrinho.cupom.descricao}</p>
              )}
            </div>
            <button
              onClick={removerCupom}
              disabled={cupomLoading}
              className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
            >
              Remover
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={cupomCodigo}
              onChange={(e) => {
                setCupomCodigo(e.target.value.toUpperCase());
                setCupomError(null);
              }}
              placeholder="Digite o código do cupom"
              className="flex-1 rounded border border-gray-300 px-4 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <button
              onClick={aplicarCupom}
              disabled={cupomLoading || !cupomCodigo.trim()}
              className="rounded bg-emerald-600 px-6 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {cupomLoading ? "Aplicando..." : "Aplicar"}
            </button>
          </div>
        )}
        {cupomError && (
          <p className="mt-2 text-sm text-red-600">{cupomError}</p>
        )}
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
          {descontoCupom > 0 && (
            <div className="flex justify-between text-base text-green-600">
              <span>Desconto do cupom:</span>
              <span className="font-semibold">-R$ {descontoCupom.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-4 flex justify-between border-t border-gray-300 pt-4 text-lg font-semibold">
            <span>Total:</span>
            <span className={totalDesconto > 0 || descontoCupom > 0 ? "text-red-600" : ""}>
              R$ {totalFinal.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/produtos"
            className="flex-1 rounded border border-gray-300 bg-white px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Continuar Comprando
          </Link>
          <button
            onClick={handleCheckout}
            disabled={checkoutLoading}
            className="flex-1 rounded bg-primary px-4 py-3 font-medium text-white hover:bg-domux-burgundy-dark disabled:opacity-50"
          >
            {checkoutLoading ? "Processando..." : "Finalizar Pedido"}
          </button>
        </div>
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
              <div className="rounded-lg bg-secondary p-4">
                <p className="mb-2 font-medium text-primary">Como acompanhar seu pedido:</p>
                <ul className="space-y-1 text-primary">
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

