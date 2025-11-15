"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Produto = {
  id: string;
  nome: string;
  tipo: string | null;
  abertura: string | null;
  acionamento: string | null;
  configuracao: string | null;
  imagens: string[];
  familia: { nome: string };
  categoria: { nome: string };
  tecidos: Array<{ id: string; nome: string; grade: string; imagemUrl: string | null }>;
  variacoes: Array<{ medida_cm: number; largura_cm: number; profundidade_cm: number; altura_cm: number }>;
};

export default function ProdutoPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [tecidoId, setTecidoId] = useState("");
  const [medida, setMedida] = useState<number | null>(null);
  const [preco, setPreco] = useState<number | null>(null);
  const [precoDisponivel, setPrecoDisponivel] = useState(true);
  const [precoLoading, setPrecoLoading] = useState(false);
  const [qtd, setQtd] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imagemAtual, setImagemAtual] = useState(0);
  const [pendingCartProcessed, setPendingCartProcessed] = useState(false);

  // Função para adicionar ao carrinho após login
  const addToCartAfterLogin = useCallback(async (item: { produtoId: string; tecidoId: string; medida: number; quantidade: number }) => {
    setAdding(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: item.produtoId,
          tecidoId: item.tecidoId,
          variacaoMedida_cm: item.medida,
          quantidade: item.quantidade,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Produto adicionado ao carrinho!");
        router.push("/cart");
      } else {
        alert("Erro ao adicionar ao carrinho: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao adicionar ao carrinho");
    } finally {
      setAdding(false);
    }
  }, [router]);

  useEffect(() => {
    fetch(`/api/produtos/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setProduto(d.data);
          if (d.data.variacoes.length > 0) {
            setMedida(d.data.variacoes[0].medida_cm);
          }
        }
      })
      .catch((err) => console.error("Erro ao carregar produto:", err))
      .finally(() => setLoading(false));
  }, [params.id]);

  // Verificar item pendente após login
  useEffect(() => {
    if (session && !pendingCartProcessed) {
      const pendingItem = sessionStorage.getItem('pendingCartItem');
      if (pendingItem) {
        try {
          const item = JSON.parse(pendingItem);
          if (item.produtoId === params.id) {
            // Restaurar seleções
            setTecidoId(item.tecidoId);
            setMedida(item.medida);
            setQtd(item.quantidade);
            // Limpar sessionStorage
            sessionStorage.removeItem('pendingCartItem');
            setPendingCartProcessed(true);
            // Tentar adicionar ao carrinho automaticamente após um pequeno delay
            setTimeout(() => {
              addToCartAfterLogin(item);
            }, 500);
          }
        } catch (e) {
          console.error("Erro ao restaurar item pendente:", e);
          setPendingCartProcessed(true);
        }
      }
    }
  }, [session, params.id, pendingCartProcessed, addToCartAfterLogin]);

  // Buscar preço dinâmico quando tecido ou medida mudarem
  useEffect(() => {
    if (tecidoId && medida) {
      setPrecoLoading(true);
      fetch(`/api/preco?produtoId=${params.id}&tecidoId=${tecidoId}&medida=${medida}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) {
            setPreco(d.data.preco);
            setPrecoDisponivel(d.data.disponivel !== false);
          } else {
            setPreco(null);
            setPrecoDisponivel(false);
          }
        })
        .catch(() => {
          setPreco(null);
          setPrecoDisponivel(false);
        })
        .finally(() => setPrecoLoading(false));
    } else {
      setPreco(null);
      setPrecoDisponivel(true);
    }
  }, [tecidoId, medida, params.id]);

  async function addToCart() {
    if (!session) {
      // Salvar dados do produto no sessionStorage para restaurar após login
      if (tecidoId && medida) {
        sessionStorage.setItem('pendingCartItem', JSON.stringify({
          produtoId: params.id,
          tecidoId,
          medida,
          quantidade: qtd,
        }));
      }
      router.push("/auth/login?callbackUrl=/produto/" + params.id + "&message=login_required");
      return;
    }

    if (!tecidoId || !medida) {
      alert("Selecione o tecido e a medida antes de adicionar ao carrinho.");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: params.id,
          tecidoId,
          variacaoMedida_cm: medida,
          quantidade: qtd,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Produto adicionado ao carrinho!");
        router.push("/cart");
      } else {
        alert("Erro ao adicionar ao carrinho: " + (data.error || "Erro desconhecido"));
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao adicionar ao carrinho");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p>Carregando produto...</p>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <p>Produto não encontrado.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  const variacaoSelecionada = produto.variacoes.find((v) => v.medida_cm === medida);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Voltar
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Galeria de Imagens */}
        <div>
          {produto.imagens && produto.imagens.length > 0 ? (
            <div>
              <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-4">
                <img
                  src={produto.imagens[imagemAtual]}
                  alt={produto.nome}
                  className="h-full w-full object-cover"
                />
              </div>
              {produto.imagens.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {produto.imagens.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImagemAtual(idx)}
                      className={`flex-shrink-0 rounded border-2 ${
                        imagemAtual === idx ? "border-blue-600" : "border-gray-200"
                      }`}
                    >
                      <img src={img} alt={`${produto.nome} ${idx + 1}`} className="h-20 w-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400">Sem imagem</span>
            </div>
          )}
        </div>

        {/* Informações do Produto */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{produto.nome}</h1>
          <p className="mt-2 text-gray-600">{produto.familia.nome}</p>
          <p className="text-sm text-gray-500">{produto.categoria.nome}</p>

          {produto.tipo && (
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-700">Tipo: </span>
              <span className="text-sm text-gray-600">{produto.tipo}</span>
            </div>
          )}

          {produto.abertura && (
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-700">Abertura: </span>
              <span className="text-sm text-gray-600">{produto.abertura}</span>
            </div>
          )}

          {produto.acionamento && (
            <div className="mt-2">
              <span className="text-sm font-medium text-gray-700">Acionamento: </span>
              <span className="text-sm text-gray-600">{produto.acionamento}</span>
            </div>
          )}

          {variacaoSelecionada && (
            <div className="mt-4 rounded-lg border bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Dimensões (medida {medida}cm)</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Largura:</span>
                  <p className="font-medium">{variacaoSelecionada.largura_cm} cm</p>
                </div>
                <div>
                  <span className="text-gray-600">Profundidade:</span>
                  <p className="font-medium">{variacaoSelecionada.profundidade_cm} cm</p>
                </div>
                <div>
                  <span className="text-gray-600">Altura:</span>
                  <p className="font-medium">{variacaoSelecionada.altura_cm} cm</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-900">Selecione o tecido</label>
            <select
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={tecidoId}
              onChange={(e) => setTecidoId(e.target.value)}
            >
              <option value="">Selecione um tecido</option>
              {produto.tecidos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.grade})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900">Selecione a medida</label>
            <select
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={medida ?? ""}
              onChange={(e) => setMedida(Number(e.target.value))}
            >
              <option value="">Selecione uma medida</option>
              {produto.variacoes.map((v) => (
                <option key={v.medida_cm} value={v.medida_cm}>
                  {v.medida_cm} cm
                </option>
              ))}
            </select>
          </div>

          {/* Exibição do Preço */}
          <div className="mt-4">
            {precoLoading ? (
              <div className="text-sm text-gray-600">Calculando preço...</div>
            ) : preco !== null && precoDisponivel ? (
              <div>
                <div className="text-3xl font-bold text-gray-900">R$ {preco.toFixed(2)}</div>
                <p className="text-sm text-gray-600">Preço unitário</p>
              </div>
            ) : tecidoId && medida ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  Me avise quando disponível
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  Este produto ainda não possui preço cadastrado para a combinação selecionada.
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900">Quantidade</label>
              <input
                type="number"
                value={qtd}
                min={1}
                onChange={(e) => setQtd(Math.max(1, Number(e.target.value)))}
                className="mt-2 w-20 rounded-lg border border-gray-300 px-3 py-2 text-center"
              />
            </div>
            <div className="flex-1">
              <button
                disabled={!tecidoId || !medida || adding || !precoDisponivel || preco === null}
                onClick={addToCart}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {adding ? "Adicionando..." : "Adicionar ao carrinho"}
              </button>
            </div>
          </div>

          {preco !== null && precoDisponivel && !precoLoading && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Total: <span className="font-semibold">R$ {(preco * qtd).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

