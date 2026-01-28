"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductImageGallery } from "@/components/storefront/ProductImageGallery";
import { Toast } from "@/components/storefront/Toast";

type ProdutoImagem = {
  id: string;
  url: string;
  tecidoId: string | null;
  tipo: string;
  ordem: number;
};

type Produto = {
  id: string;
  nome: string;
  tipo: string | null;
  abertura: string | null;
  acionamento: string | null;
  configuracao: string | null;
  possuiLados: boolean;
  imagens: string[];
  imagensDetalhadas?: ProdutoImagem[];
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
  const [lado, setLado] = useState<"esquerdo" | "direito" | "">("");
  const [preco, setPreco] = useState<number | null>(null);
  const [precoOriginal, setPrecoOriginal] = useState<number | null>(null);
  const [descontoPercentual, setDescontoPercentual] = useState<number | null>(null);
  const [precoDisponivel, setPrecoDisponivel] = useState(true);
  const [precoLoading, setPrecoLoading] = useState(false);
  const [qtd, setQtd] = useState(1);
  const [adding, setAdding] = useState(false);
  const [pendingCartProcessed, setPendingCartProcessed] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Função para adicionar ao carrinho após login
  const addToCartAfterLogin = useCallback(async (item: { produtoId: string; tecidoId: string; medida: number; quantidade: number; lado?: string }) => {
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
          lado: item.lado || undefined,
        }),
      });

      const data = await res.json();
      console.log("[ADD TO CART DEBUG - After Login] Resposta:", data);
      if (res.ok) {
        console.log("[ADD TO CART DEBUG - After Login] Item adicionado:", data.data);
        setToast({ message: "Produto adicionado ao carrinho!", type: "success" });
        setTimeout(() => {
          router.push("/cart");
        }, 1500);
      } else {
        console.error("[ADD TO CART DEBUG - After Login] Erro:", data);
        setToast({ message: "Erro ao adicionar ao carrinho: " + (data.error || "Erro desconhecido"), type: "error" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setToast({ message: "Erro ao adicionar ao carrinho", type: "error" });
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
  
  // Filtrar imagens baseado no tecido selecionado
  const imagensFiltradas = produto ? (() => {
    // Se houver imagensDetalhadas, usar elas
    if (produto.imagensDetalhadas && produto.imagensDetalhadas.length > 0) {
      return produto.imagensDetalhadas
        .filter(img => {
          // Mostrar imagens sem tecido específico (null) OU imagens do tecido selecionado
          return !img.tecidoId || (tecidoId && img.tecidoId === tecidoId);
        })
        .sort((a, b) => {
          // Ordenar: principal primeiro, depois por ordem
          if (a.tipo === "principal") return -1;
          if (b.tipo === "principal") return 1;
          return a.ordem - b.ordem;
        })
        .map(img => img.url);
    }
    // Fallback para imagens antigas (compatibilidade)
    return produto.imagens || [];
  })() : [];
  

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
            if (item.lado) {
              setLado(item.lado as "esquerdo" | "direito");
            }
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
            setPrecoOriginal(d.data.precoOriginal || null);
            setDescontoPercentual(d.data.descontoPercentual || null);
            setPrecoDisponivel(d.data.disponivel !== false);
          } else {
            setPreco(null);
            setPrecoOriginal(null);
            setDescontoPercentual(null);
            setPrecoDisponivel(false);
          }
        })
        .catch(() => {
          setPreco(null);
          setPrecoOriginal(null);
          setDescontoPercentual(null);
          setPrecoDisponivel(false);
        })
        .finally(() => setPrecoLoading(false));
    } else {
      setPreco(null);
      setPrecoOriginal(null);
      setDescontoPercentual(null);
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
          lado: lado || undefined,
        }));
      }
      router.push("/auth/login?callbackUrl=/produto/" + params.id + "&message=login_required");
      return;
    }

    if (!tecidoId || !medida) {
      setToast({ message: "Selecione o tecido e a medida antes de adicionar ao carrinho.", type: "info" });
      return;
    }

    // Validar lado se o produto possui lados
    if (produto?.possuiLados && !lado) {
      setToast({ message: "Selecione o lado (esquerdo ou direito) antes de adicionar ao carrinho.", type: "info" });
      return;
    }

    setAdding(true);
    try {
      console.log("[ADD TO CART DEBUG] Adicionando produto:", { produtoId: params.id, tecidoId, variacaoMedida_cm: medida, quantidade: qtd, lado });
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: params.id,
          tecidoId,
          variacaoMedida_cm: medida,
          quantidade: qtd,
          lado: produto?.possuiLados ? lado : undefined,
        }),
      });

      let data: { ok?: boolean; error?: string; message?: string; data?: unknown } = {};
      try {
        const text = await res.text();
        if (text) data = JSON.parse(text);
      } catch {
        data = { error: res.status === 401 ? "Faça login para adicionar ao carrinho." : "Resposta inválida do servidor." };
      }
      console.log("[ADD TO CART DEBUG] Resposta completa:", { status: res.status, ok: res.ok, data });
      if (res.ok) {
        console.log("[ADD TO CART DEBUG] Item adicionado com sucesso:", data.data);
        setToast({ message: "Produto adicionado ao carrinho!", type: "success" });
        setTimeout(() => {
          router.push("/cart");
        }, 1500);
      } else {
        console.error("[ADD TO CART DEBUG] Erro na resposta:", data);
        const errorMsg = data.error || data.message || (res.status === 422 ? "Verifique se este produto tem preço cadastrado para a medida e tecido escolhidos na tabela de preços." : "Erro desconhecido ao adicionar ao carrinho.");
        setToast({ message: "Erro ao adicionar ao carrinho: " + errorMsg, type: "error" });
      }
    } catch (error) {
      console.error("[ADD TO CART DEBUG] Erro na requisição:", error);
      setToast({ message: "Erro ao adicionar ao carrinho. Verifique sua conexão e tente novamente.", type: "error" });
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
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  const variacaoSelecionada = produto.variacoes.find((v) => v.medida_cm === medida);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-4">
          <Link href="/" className="text-primary hover:underline">
            ← Voltar
          </Link>
        </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Galeria de Imagens */}
        <div>
          {imagensFiltradas.length > 0 ? (
            <ProductImageGallery
              imagens={imagensFiltradas}
              produtoNome={produto.nome}
              tecidoId={tecidoId || undefined}
              totalFotos={imagensFiltradas.length}
            />
          ) : produto.imagens && produto.imagens.length > 0 ? (
            <ProductImageGallery
              imagens={produto.imagens}
              produtoNome={produto.nome}
            />
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
            <div className="mt-2 flex gap-4 items-start">
              <select
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
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
              
              {/* Preview da imagem do tecido selecionado */}
              {tecidoId && (() => {
                const tecidoSelecionado = produto.tecidos.find(t => t.id === tecidoId);
                const imagemTecido = tecidoSelecionado?.imagemUrl;
                const isValidImage = imagemTecido && (imagemTecido.startsWith("http") || imagemTecido.startsWith("/"));
                
                return (
                  <div className="flex-shrink-0">
                    {isValidImage ? (
                      <div className="relative w-24 h-24 rounded-lg border-2 border-gray-300 overflow-hidden bg-gray-100">
                        <img
                          src={imagemTecido}
                          alt={tecidoSelecionado?.nome || "Tecido"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3ESem imagem%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                        <span className="text-xs text-gray-400 text-center px-2">Sem imagem</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-900">Selecione a medida</label>
            <select
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
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

          {/* Seletor de Lado - apenas quando possuiLados = true */}
          {produto.possuiLados && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-900">
                Selecione o lado <span className="text-red-500">*</span>
              </label>
              <select
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                value={lado}
                onChange={(e) => setLado(e.target.value as "esquerdo" | "direito" | "")}
              >
                <option value="">Selecione o lado</option>
                <option value="esquerdo">Esquerdo</option>
                <option value="direito">Direito</option>
              </select>
            </div>
          )}

          {/* Exibição do Preço */}
          <div className="mt-4">
            {precoLoading ? (
              <div className="text-sm text-gray-600">Calculando preço...</div>
            ) : preco !== null && precoDisponivel ? (
              <div>
                {descontoPercentual && descontoPercentual > 0 && precoOriginal ? (
                  <>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xl text-gray-500 line-through">
                        R$ {precoOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                        -{descontoPercentual}%
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      R$ {preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Preço unitário com desconto</p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-900">R$ {preco.toFixed(2)}</div>
                    <p className="text-sm text-gray-600">Preço unitário</p>
                  </>
                )}
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
                disabled={!tecidoId || !medida || (produto?.possuiLados && !lado) || adding || !precoDisponivel || preco === null}
                onClick={addToCart}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-domux-burgundy-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {adding ? "Adicionando..." : "Adicionar ao carrinho"}
              </button>
            </div>
          </div>

          {preco !== null && precoDisponivel && !precoLoading && (
            <div className="mt-4 text-center text-sm text-gray-600">
              {descontoPercentual && descontoPercentual > 0 && precoOriginal ? (
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500 line-through">
                      Total: R$ {(precoOriginal * qtd).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1">
                    Total com desconto: <span className="font-semibold text-red-600">R$ {(preco * qtd).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <div>
                  Total: <span className="font-semibold">R$ {(preco * qtd).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

