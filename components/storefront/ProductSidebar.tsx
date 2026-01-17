"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { PriceFilter } from "./PriceFilter";

interface Categoria {
  id: string;
  nome: string;
  _count?: { produtos: number };
}

interface ProdutoBestSeller {
  id: string;
  nome: string;
  imagens: string[];
  preco?: number;
}

interface FiltrosConfig {
  filtrosAtivos: boolean;
  filtrosTitulo: boolean;
  filtrosAplicados: boolean;
  filtroCategoriaAtivo: boolean;
  filtroCategoriaNome: string;
  filtroCategoriaCategorias: string[];
  filtroPrecoAtivo: boolean;
  filtroPrecoNome: string;
  filtroOpcoesProdutoAtivo: boolean;
  filtroOpcoesProdutoNome: string;
}

interface FiltrosOpcoes {
  medidas: number[];
  tecidos: string[];
  tipos: string[];
  aberturas: string[];
  acionamentos: string[];
}

interface ProductSidebarProps {
  categorias: Categoria[];
  produtosBestSellers?: ProdutoBestSeller[];
  categoriaSelecionada?: string | string[]; // Aceita string única ou array para múltipla seleção
  onCategoriaChange?: (categoriaIds: string[]) => void; // Sempre passa array
  precoMin?: string;
  precoMax?: string;
  onPrecoChange?: (min: string, max: string) => void;
  precoMinRange?: number;
  precoMaxRange?: number;
  comDesconto?: boolean;
  onComDescontoChange?: (comDesconto: boolean) => void;
  onOpcoesChange?: (opcoes: FiltrosOpcoes) => void;
}

// Helper para converter PriceRange para strings (compatibilidade com código existente)
function priceRangeToStrings(range: { min: number; max: number }, minLimit: number, maxLimit: number): { min: string; max: string } {
  return {
    min: range.min === minLimit ? "" : range.min.toString(),
    max: range.max === maxLimit ? "" : range.max.toString(),
  };
}

export function ProductSidebar({
  categorias,
  produtosBestSellers = [],
  categoriaSelecionada,
  onCategoriaChange,
  precoMin: precoMinProp,
  precoMax: precoMaxProp,
  onPrecoChange,
  precoMinRange = 0,
  precoMaxRange = 50000,
  comDesconto: comDescontoProp = false,
  onComDescontoChange,
  onOpcoesChange,
}: ProductSidebarProps) {
  // Estado para o filtro de preço usando PriceRange
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>(() => {
    const min = precoMinProp ? parseFloat(precoMinProp) : precoMinRange;
    const max = precoMaxProp ? parseFloat(precoMaxProp) : precoMaxRange;
    return {
      min: isNaN(min) ? precoMinRange : Math.max(precoMinRange, Math.min(min, precoMaxRange)),
      max: isNaN(max) ? precoMaxRange : Math.max(precoMinRange, Math.min(max, precoMaxRange)),
    };
  });

  // Sincronizar priceRange quando props mudarem
  useEffect(() => {
    const min = precoMinProp ? parseFloat(precoMinProp) : precoMinRange;
    const max = precoMaxProp ? parseFloat(precoMaxProp) : precoMaxRange;
    if (!isNaN(min) && !isNaN(max)) {
      setPriceRange({
        min: Math.max(precoMinRange, Math.min(min, precoMaxRange)),
        max: Math.max(precoMinRange, Math.min(max, precoMaxRange)),
      });
    }
  }, [precoMinProp, precoMaxProp, precoMinRange, precoMaxRange]);

  // Quando priceRange mudar, notificar componente pai (compatibilidade com formato antigo)
  useEffect(() => {
    if (onPrecoChange) {
      const strings = priceRangeToStrings(priceRange, precoMinRange, precoMaxRange);
      onPrecoChange(strings.min, strings.max);
    }
  }, [priceRange, precoMinRange, precoMaxRange, onPrecoChange]);
  const [filtrosConfig, setFiltrosConfig] = useState<FiltrosConfig | null>(null);
  const [loadingFiltrosConfig, setLoadingFiltrosConfig] = useState(true);
  const [comDesconto, setComDesconto] = useState<boolean>(comDescontoProp);
  const [opcoesProduto, setOpcoesProduto] = useState<{
    medidas: number[];
    tecidos: Array<{ id: string; nome: string; grade: string }>;
    tipos: string[];
    aberturas: string[];
    acionamentos: string[];
  } | null>(null);
  const [filtrosOpcoes, setFiltrosOpcoes] = useState<FiltrosOpcoes>({
    medidas: [],
    tecidos: [],
    tipos: [],
    aberturas: [],
    acionamentos: [],
  });

  // Notificar mudanças nos filtros de opções
  useEffect(() => {
    if (onOpcoesChange) {
      onOpcoesChange(filtrosOpcoes);
    }
  }, [filtrosOpcoes, onOpcoesChange]);

  // Carregar configurações de filtros
  useEffect(() => {
    fetch("/api/filtros-config")
      .then((res) => res.json())
      .then((data) => {
        setFiltrosConfig(data);
        setLoadingFiltrosConfig(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar configurações de filtros:", err);
        setLoadingFiltrosConfig(false);
      });
  }, []);

  // Carregar opções de produto
  useEffect(() => {
    if (filtrosConfig?.filtroOpcoesProdutoAtivo) {
      fetch("/api/produtos/opcoes")
        .then((res) => res.json())
        .then((data) => {
          setOpcoesProduto(data);
        })
        .catch((err) => {
          console.error("Erro ao carregar opções de produto:", err);
        });
    }
  }, [filtrosConfig?.filtroOpcoesProdutoAtivo]);

  // Filtrar categorias baseado na configuração
  const categoriasFiltradas = filtrosConfig?.filtroCategoriaCategorias.length 
    ? categorias.filter(cat => filtrosConfig.filtroCategoriaCategorias.includes(cat.id))
    : categorias;

  // Sincronizar comDesconto com prop
  useEffect(() => {
    setComDesconto(comDescontoProp);
  }, [comDescontoProp]);

  // Notificar mudanças em comDesconto
  useEffect(() => {
    if (onComDescontoChange) {
      onComDescontoChange(comDesconto);
    }
  }, [comDesconto, onComDescontoChange]);



  return (
    <aside className="w-full lg:w-80 space-y-8 pr-4">
      {/* CATEGORIES */}
      {filtrosConfig?.filtroCategoriaAtivo && (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">
          {filtrosConfig.filtroCategoriaNome}
        </h3>
        <div className="space-y-2">
          {categoriasFiltradas.map((cat) => {
            const count = cat._count?.produtos || 0;
            // Converter categoriaSelecionada para array se necessário
            const categoriasSelecionadasArray = Array.isArray(categoriaSelecionada) 
              ? categoriaSelecionada 
              : categoriaSelecionada 
                ? [categoriaSelecionada] 
                : [];
            const isSelected = categoriasSelecionadasArray.includes(cat.id);
            return (
              <div key={cat.id}>
                {onCategoriaChange ? (
                  <label className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const novasCategorias = e.target.checked
                          ? [...categoriasSelecionadasArray, cat.id]
                          : categoriasSelecionadasArray.filter(id => id !== cat.id);
                        onCategoriaChange(novasCategorias);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className={`text-sm font-medium transition-colors ${
                      isSelected
                        ? "text-primary font-semibold"
                        : "text-gray-700"
                    }`}>
                      {cat.nome} ({count})
                    </span>
                  </label>
                ) : (
                  <Link
                    href={`/categoria/${cat.id}`}
                    className={`block text-sm font-medium transition-colors p-2 rounded hover:bg-gray-50 ${
                      isSelected
                        ? "text-primary font-semibold"
                        : "text-gray-600 hover:text-primary"
                    }`}
                  >
                    {cat.nome} ({count})
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* FILTER BY PRICE */}
      {filtrosConfig?.filtroPrecoAtivo && (
      <div>
        <PriceFilter
          minLimit={precoMinRange}
          maxLimit={precoMaxRange}
          step={1}
          value={priceRange}
          onChange={(next) => setPriceRange(next)}
          title={filtrosConfig.filtroPrecoNome}
          onClear={() => {
            setComDesconto(false);
            if (onComDescontoChange) {
              onComDescontoChange(false);
            }
          }}
        />

        {/* Checkbox Com Desconto */}
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <label className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={comDesconto}
              onChange={(e) => setComDesconto(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-gray-700">
              Com desconto
            </span>
          </label>
        </div>
      </div>
      )}

      {/* FILTER BY PRODUCT OPTIONS */}
      {filtrosConfig?.filtroOpcoesProdutoAtivo && opcoesProduto && (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">
          {filtrosConfig.filtroOpcoesProdutoNome}
        </h3>

        {/* Filtro por Tamanho (Medidas) */}
        {opcoesProduto.medidas.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tamanho</h4>
            <div className="flex flex-wrap gap-2">
              {opcoesProduto.medidas.map((medida) => {
                const isSelected = filtrosOpcoes.medidas.includes(medida);
                return (
                  <button
                    key={medida}
                    onClick={() => {
                      setFiltrosOpcoes((prev) => ({
                        ...prev,
                        medidas: isSelected
                          ? prev.medidas.filter((m) => m !== medida)
                          : [...prev.medidas, medida],
                      }));
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {medida}cm
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtro por Tipo */}
        {opcoesProduto.tipos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tipo</h4>
            <div className="space-y-2">
              {opcoesProduto.tipos.map((tipo) => {
                const isSelected = filtrosOpcoes.tipos.includes(tipo);
                return (
                  <label
                    key={tipo}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        setFiltrosOpcoes((prev) => ({
                          ...prev,
                          tipos: e.target.checked
                            ? [...prev.tipos, tipo]
                            : prev.tipos.filter((t) => t !== tipo),
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{tipo}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtro por Abertura */}
        {opcoesProduto.aberturas.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Abertura</h4>
            <div className="space-y-2">
              {opcoesProduto.aberturas.map((abertura) => {
                const isSelected = filtrosOpcoes.aberturas.includes(abertura);
                return (
                  <label
                    key={abertura}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        setFiltrosOpcoes((prev) => ({
                          ...prev,
                          aberturas: e.target.checked
                            ? [...prev.aberturas, abertura]
                            : prev.aberturas.filter((a) => a !== abertura),
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{abertura}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtro por Acionamento */}
        {opcoesProduto.acionamentos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Acionamento</h4>
            <div className="space-y-2">
              {opcoesProduto.acionamentos.map((acionamento) => {
                const isSelected = filtrosOpcoes.acionamentos.includes(acionamento);
                return (
                  <label
                    key={acionamento}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        setFiltrosOpcoes((prev) => ({
                          ...prev,
                          acionamentos: e.target.checked
                            ? [...prev.acionamentos, acionamento]
                            : prev.acionamentos.filter((a) => a !== acionamento),
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{acionamento}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Filtro por Tecido (Cores) */}
        {opcoesProduto.tecidos.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tecido</h4>
            <div className="space-y-2">
              {opcoesProduto.tecidos.map((tecido) => {
                const isSelected = filtrosOpcoes.tecidos.includes(tecido.id);
                return (
                  <label
                    key={tecido.id}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        setFiltrosOpcoes((prev) => ({
                          ...prev,
                          tecidos: e.target.checked
                            ? [...prev.tecidos, tecido.id]
                            : prev.tecidos.filter((t) => t !== tecido.id),
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">{tecido.nome}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
      )}

      {/* BEST SELLERS */}
      {produtosBestSellers.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">Mais Vendidos</h3>
          <div className="space-y-4">
            {produtosBestSellers.map((produto) => (
              <Link
                key={produto.id}
                href={`/produto/${produto.id}`}
                className="flex gap-3 group"
              >
                {produto.imagens?.[0] ? (
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={produto.imagens[0]}
                      alt={produto.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-400">Sem imagem</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                    {produto.nome}
                  </h4>
                  {produto.preco !== undefined && produto.preco !== null && (
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      R$ {produto.preco.toFixed(2)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* TAGS */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {/* Tags podem ser adicionadas aqui no futuro */}
          <span className="text-sm text-gray-500">Nenhuma tag disponível</span>
        </div>
      </div>
    </aside>
  );
}

