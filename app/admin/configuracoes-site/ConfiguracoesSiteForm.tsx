"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

interface Categoria {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  categoria: { nome: string };
  familia: { nome: string };
}

interface ProdutoTabela {
  id: string;
  nome: string;
  categoria: { id: string; nome: string };
  familia: { id: string; nome: string };
}

interface TabelaPreco {
  id: string;
  nome: string;
  descricao: string | null;
}

interface SiteConfig {
  id: string;
  categoriasDestaque: string[];
  produtosDestaque: string[];
  tabelaPrecoVigenteId: string | null;
  produtosAtivosTabelaVigente: string[];
  descontosProdutosDestaque?: Record<string, number> | null;
  ordemCategorias: string[];
  tabelaPrecoVigente: TabelaPreco | null;
}

interface Props {
  siteConfig: SiteConfig;
  categorias: Categoria[];
  produtos: Produto[];
  tabelasPreco: TabelaPreco[];
}

export default function ConfiguracoesSiteForm({
  siteConfig,
  categorias,
  produtos,
  tabelasPreco,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>(
    siteConfig.categoriasDestaque || []
  );
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>(
    siteConfig.produtosDestaque || []
  );
  const [tabelaPrecoSelecionada, setTabelaPrecoSelecionada] = useState<string>(
    siteConfig.tabelaPrecoVigenteId || ""
  );
  const [produtosTabelaVigente, setProdutosTabelaVigente] = useState<ProdutoTabela[]>([]);
  const [produtosAtivosTabelaVigente, setProdutosAtivosTabelaVigente] = useState<string[]>(
    siteConfig.produtosAtivosTabelaVigente || []
  );
  const [loadingProdutosTabela, setLoadingProdutosTabela] = useState(false);
  const [descontosProdutosDestaque, setDescontosProdutosDestaque] = useState<Record<string, number>>(
    (siteConfig.descontosProdutosDestaque as Record<string, number>) || {}
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/configuracoes-site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoriasDestaque: categoriasSelecionadas,
          produtosDestaque: produtosSelecionados,
          tabelaPrecoVigenteId: tabelaPrecoSelecionada || null,
          produtosAtivosTabelaVigente: produtosAtivosTabelaVigente,
          descontosProdutosDestaque: descontosProdutosDestaque,
          ordemCategorias: categoriasSelecionadas, // Por enquanto, ordem = ordem de seleção
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Erro ao salvar configurações");
      }

      router.refresh();
      alert("Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      const errorMessage = error?.message || "Erro ao salvar configurações. Tente novamente.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoria = (categoriaId: string) => {
    setCategoriasSelecionadas((prev) =>
      prev.includes(categoriaId)
        ? prev.filter((id) => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  const toggleProduto = (produtoId: string) => {
    setProdutosSelecionados((prev) => {
      const newList = prev.includes(produtoId)
        ? prev.filter((id) => id !== produtoId)
        : [...prev, produtoId];
      
      // Se produto foi removido, remover também o desconto
      if (prev.includes(produtoId) && !newList.includes(produtoId)) {
        setDescontosProdutosDestaque((prevDescontos) => {
          const newDescontos = { ...prevDescontos };
          delete newDescontos[produtoId];
          return newDescontos;
        });
      }
      
      return newList;
    });
  };

  const atualizarDesconto = (produtoId: string, desconto: number) => {
    setDescontosProdutosDestaque((prev) => ({
      ...prev,
      [produtoId]: desconto > 0 ? desconto : 0,
    }));
  };

  const toggleProdutoTabelaVigente = (produtoId: string) => {
    setProdutosAtivosTabelaVigente((prev) =>
      prev.includes(produtoId)
        ? prev.filter((id) => id !== produtoId)
        : [...prev, produtoId]
    );
  };

  // Carregar produtos da tabela quando uma tabela for selecionada
  useEffect(() => {
    const carregarProdutosTabela = async () => {
      if (!tabelaPrecoSelecionada) {
        setProdutosTabelaVigente([]);
        setProdutosAtivosTabelaVigente([]);
        return;
      }

      setLoadingProdutosTabela(true);
      try {
        const response = await fetch(`/api/tabelas-preco/${tabelaPrecoSelecionada}/produtos`);
        const data = await response.json();
        
        if (data.ok && data.data?.produtos) {
          setProdutosTabelaVigente(data.data.produtos);
          // Se a tabela selecionada for a mesma que está salva no siteConfig, manter produtos ativos
          // Caso contrário, limpar produtos ativos
          if (tabelaPrecoSelecionada === siteConfig.tabelaPrecoVigenteId && siteConfig.produtosAtivosTabelaVigente?.length > 0) {
            // Manter apenas produtos que existem na nova lista de produtos da tabela
            const produtosValidos = siteConfig.produtosAtivosTabelaVigente.filter(id => 
              data.data.produtos.some((p: ProdutoTabela) => p.id === id)
            );
            setProdutosAtivosTabelaVigente(produtosValidos);
          } else {
            setProdutosAtivosTabelaVigente([]);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar produtos da tabela:", error);
        setProdutosTabelaVigente([]);
        setProdutosAtivosTabelaVigente([]);
      } finally {
        setLoadingProdutosTabela(false);
      }
    };

    carregarProdutosTabela();
  }, [tabelaPrecoSelecionada, siteConfig.tabelaPrecoVigenteId, siteConfig.produtosAtivosTabelaVigente]);

  // Filtrar produtos disponíveis para destaques baseado nos produtos ativos da tabela vigente
  const produtosDisponiveisDestaque = useMemo(() => {
    // Se não houver tabela vigente selecionada, não mostrar nenhum produto
    if (!tabelaPrecoSelecionada) {
      return [];
    }
    
    // Se não houver produtos ativos selecionados, não mostrar nenhum produto
    if (produtosAtivosTabelaVigente.length === 0) {
      return [];
    }

    // Filtrar produtos que estão na lista de produtos ativos da tabela vigente
    return produtos.filter((produto) => 
      produtosAtivosTabelaVigente.includes(produto.id)
    );
  }, [produtos, produtosAtivosTabelaVigente, tabelaPrecoSelecionada]);

  // Limpar produtos em destaque que não estão mais na lista de produtos ativos
  useEffect(() => {
    if (produtosDisponiveisDestaque.length > 0) {
      const produtosValidos = produtosSelecionados.filter(id => 
        produtosDisponiveisDestaque.some(p => p.id === id)
      );
      if (produtosValidos.length !== produtosSelecionados.length) {
        setProdutosSelecionados(produtosValidos);
      }
    } else if (produtosSelecionados.length > 0) {
      // Se não houver produtos disponíveis, limpar seleção
      setProdutosSelecionados([]);
    }
  }, [produtosDisponiveisDestaque]);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção: Tabela de Preço Vigente */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Tabela de Preço Vigente
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Selecione qual tabela de preço está ativa no momento para exibição no site
        </p>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300">
            <input
              type="radio"
              name="tabelaPreco"
              value=""
              checked={tabelaPrecoSelecionada === ""}
              onChange={(e) => setTabelaPrecoSelecionada(e.target.value)}
              className="mr-3 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                Nenhuma (usar padrão)
              </span>
            </div>
          </label>
          {tabelasPreco.map((tabela) => (
            <label
              key={tabela.id}
              className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                tabelaPrecoSelecionada === tabela.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="tabelaPreco"
                value={tabela.id}
                checked={tabelaPrecoSelecionada === tabela.id}
                onChange={(e) => setTabelaPrecoSelecionada(e.target.value)}
                className="mr-3 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {tabela.nome}
                </span>
                {tabela.descricao && (
                  <p className="mt-1 text-xs text-gray-500">{tabela.descricao}</p>
                )}
              </div>
            </label>
          ))}
        </div>
        {tabelaPrecoSelecionada && (
          <p className="mt-4 text-sm text-gray-500">
            Tabela selecionada:{" "}
            {tabelasPreco.find((t) => t.id === tabelaPrecoSelecionada)?.nome}
          </p>
        )}
      </div>

      {/* Seção: Produtos Ativos da Tabela Vigente */}
      {tabelaPrecoSelecionada && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Produtos Ativos da Tabela Vigente
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Selecione quais produtos da tabela de preço vigente estarão disponíveis no site
          </p>
          {loadingProdutosTabela ? (
            <div className="py-8 text-center text-gray-500">
              Carregando produtos...
            </div>
          ) : produtosTabelaVigente.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Nenhum produto encontrado nesta tabela
            </div>
          ) : (
            <>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {produtosTabelaVigente.map((produto) => {
                  const isSelected = produtosAtivosTabelaVigente.includes(produto.id);
                  return (
                    <label
                      key={produto.id}
                      className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProdutoTabelaVigente(produto.id)}
                        className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {produto.nome}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {produto.categoria.nome} / {produto.familia.nome}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {produtosAtivosTabelaVigente.length > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  {produtosAtivosTabelaVigente.length} produto(s) ativo(s) selecionado(s)
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Seção: Produtos em Destaque */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Produtos em Destaque
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          {tabelaPrecoSelecionada && produtosAtivosTabelaVigente.length > 0
            ? "Selecione os produtos que aparecerão na seção \"Produtos em Destaque\" da página inicial (apenas produtos ativos da tabela vigente)"
            : tabelaPrecoSelecionada
            ? "Selecione primeiro os produtos ativos da tabela vigente acima"
            : "Selecione primeiro uma tabela de preço vigente acima"}
        </p>
        {!tabelaPrecoSelecionada ? (
          <div className="py-8 text-center text-gray-500">
            Selecione uma tabela de preço vigente para habilitar a seleção de produtos em destaque
          </div>
        ) : produtosAtivosTabelaVigente.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Selecione produtos ativos da tabela vigente acima para habilitar a seleção de produtos em destaque
          </div>
        ) : produtosDisponiveisDestaque.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Nenhum produto disponível para destaques
          </div>
        ) : (
          <>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {produtosDisponiveisDestaque.map((produto) => {
                const isSelected = produtosSelecionados.includes(produto.id);
                const descontoAtual = descontosProdutosDestaque[produto.id] || 0;
                return (
                  <div
                    key={produto.id}
                    className={`rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center">
                      <label className="flex cursor-pointer items-center flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduto(produto.id)}
                          className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {produto.nome}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {produto.categoria.nome} / {produto.familia.nome}
                          </span>
                        </div>
                      </label>
                      {isSelected && (
                        <div className="ml-4 flex items-center gap-2">
                          <label className="text-xs text-gray-600 whitespace-nowrap">
                            Desconto (%):
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={descontoAtual}
                            onChange={(e) => {
                              const valor = parseFloat(e.target.value) || 0;
                              atualizarDesconto(produto.id, Math.max(0, Math.min(100, valor)));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {produtosSelecionados.length > 0 && (
              <p className="mt-4 text-sm text-gray-500">
                {produtosSelecionados.length} produto(s) selecionado(s)
              </p>
            )}
          </>
        )}
      </div>

      {/* Seção: Categorias em Destaque */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Categorias em Destaque
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Selecione as categorias que aparecerão na página inicial do site
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categorias.map((categoria) => {
            const isSelected = categoriasSelecionadas.includes(categoria.id);
            return (
              <label
                key={categoria.id}
                className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategoria(categoria.id)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  {categoria.nome}
                </span>
              </label>
            );
          })}
        </div>
        {categoriasSelecionadas.length > 0 && (
          <p className="mt-4 text-sm text-gray-500">
            {categoriasSelecionadas.length} categoria(s) selecionada(s)
          </p>
        )}
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </form>
  );
}

