"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";

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
  const [precoMin, setPrecoMin] = useState(precoMinProp || "");
  const [precoMax, setPrecoMax] = useState(precoMaxProp || "");
  const [precoMinSlider, setPrecoMinSlider] = useState(precoMinRange);
  const [precoMaxSlider, setPrecoMaxSlider] = useState(precoMaxRange);
  const [activeSlider, setActiveSlider] = useState<"min" | "max" | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Converter valores para número
  const precoMinNum = precoMin ? parseFloat(precoMin) : precoMinRange;
  const precoMaxNum = precoMax ? parseFloat(precoMax) : precoMaxRange;

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

  // Sincronizar valores quando props mudarem
  useEffect(() => {
    if (precoMinProp !== undefined) {
      setPrecoMin(precoMinProp);
      if (precoMinProp) {
        setPrecoMinSlider(parseFloat(precoMinProp));
      }
    }
  }, [precoMinProp]);

  useEffect(() => {
    if (precoMaxProp !== undefined) {
      setPrecoMax(precoMaxProp);
      if (precoMaxProp) {
        setPrecoMaxSlider(parseFloat(precoMaxProp));
      }
    }
  }, [precoMaxProp]);

  // Garantir que o slider seja liberado quando o mouse for solto em qualquer lugar
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (activeSlider !== null) {
        setActiveSlider(null);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (activeSlider !== null) {
        setActiveSlider(null);
      }
    };

    if (activeSlider !== null) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalTouchEnd);
      document.addEventListener('touchcancel', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [activeSlider]);

  // Aplicar filtro automaticamente com debounce
  const aplicarFiltro = useCallback((min: string, max: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (onPrecoChange) {
        onPrecoChange(min, max);
      }
    }, 300); // Debounce de 300ms
  }, [onPrecoChange]);

  // Atualizar quando slider mínimo mudar
  const handleMinSliderChange = (value: number) => {
    // Garantir que min não seja maior que max - se for, ajustar para o valor do max
    const finalMin = Math.min(value, precoMaxSlider);
    setPrecoMinSlider(finalMin);
    setPrecoMin(finalMin.toString());
    aplicarFiltro(finalMin.toString(), precoMax.toString() || precoMaxSlider.toString());
  };

  // Atualizar quando slider máximo mudar
  const handleMaxSliderChange = (value: number) => {
    // Garantir que max não seja menor que min - se for, ajustar para o valor do min
    const finalMax = Math.max(value, precoMinSlider);
    setPrecoMaxSlider(finalMax);
    setPrecoMax(finalMax.toString());
    aplicarFiltro(precoMin.toString() || precoMinSlider.toString(), finalMax.toString());
  };

  // Handler para quando o usuário começa a arrastar
  const handleSliderMouseDown = (type: "min" | "max") => {
    setActiveSlider(type);
  };

  // Handler para quando o usuário solta o slider
  const handleSliderMouseUp = () => {
    setActiveSlider(null);
  };

  // Atualizar quando input mudar
  const handleInputChange = (type: "min" | "max", value: string) => {
    if (type === "min") {
      setPrecoMin(value);
      if (value) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          // Garantir que min não seja maior que max
          const finalMin = Math.max(precoMinRange, Math.min(numValue, precoMaxSlider));
          setPrecoMinSlider(finalMin);
          aplicarFiltro(finalMin.toString(), precoMax.toString() || precoMaxSlider.toString());
        } else {
          aplicarFiltro("", precoMax.toString() || precoMaxSlider.toString());
        }
      } else {
        aplicarFiltro("", precoMax.toString() || precoMaxSlider.toString());
      }
    } else {
      setPrecoMax(value);
      if (value) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          // Garantir que max não seja menor que min
          const finalMax = Math.min(precoMaxRange, Math.max(numValue, precoMinSlider));
          setPrecoMaxSlider(finalMax);
          aplicarFiltro(precoMin.toString() || precoMinSlider.toString(), finalMax.toString());
        } else {
          aplicarFiltro(precoMin.toString() || precoMinSlider.toString(), "");
        }
      } else {
        aplicarFiltro(precoMin.toString() || precoMinSlider.toString(), "");
      }
    }
  };

  // Formatar valor monetário
  const formatarPreco = (valor: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(valor);
  };


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
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            {filtrosConfig.filtroPrecoNome}
          </h3>
        </div>
        
        {/* Slider de Range */}
        <div className="mb-4">
          <div className="relative h-2 bg-gray-200 rounded-full">
            {/* Barra preenchida entre os valores */}
            <div
              className="absolute h-2 bg-primary rounded-full pointer-events-none z-0"
              style={{
                left: `${((precoMinSlider - precoMinRange) / (precoMaxRange - precoMinRange)) * 100}%`,
                width: `${((precoMaxSlider - precoMinSlider) / (precoMaxRange - precoMinRange)) * 100}%`,
              }}
            />
            {/* Slider Mínimo - Bola da Esquerda */}
            <input
              type="range"
              min={precoMinRange}
              max={precoMaxSlider}
              value={precoMinSlider}
              step="1"
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                // O max já está limitando o range, então sempre será válido
                handleMinSliderChange(newValue);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setActiveSlider("min");
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                setActiveSlider(null);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setActiveSlider("min");
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setActiveSlider(null);
              }}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
              style={{ 
                WebkitAppearance: 'none',
                appearance: 'none',
                height: '8px',
                margin: 0,
                padding: 0,
                zIndex: activeSlider === "min" ? 30 : 20,
                pointerEvents: activeSlider === "max" ? 'none' : 'auto',
              }}
            />
            {/* Slider Máximo - Bola da Direita */}
            <input
              type="range"
              min={precoMinSlider}
              max={precoMaxRange}
              value={precoMaxSlider}
              step="1"
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                // O min já está limitando o range, então sempre será válido
                handleMaxSliderChange(newValue);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                setActiveSlider("max");
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                setActiveSlider(null);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setActiveSlider("max");
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setActiveSlider(null);
              }}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
              style={{ 
                WebkitAppearance: 'none',
                appearance: 'none',
                height: '8px',
                margin: 0,
                padding: 0,
                zIndex: activeSlider === "max" ? 30 : 20,
                pointerEvents: activeSlider === "min" ? 'none' : 'auto',
              }}
            />
          </div>
          
          {/* Valores do Slider */}
          <div className="flex justify-between mt-2">
            <span className="text-sm font-medium text-gray-900">
              {formatarPreco(precoMinSlider)}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatarPreco(precoMaxSlider)}
            </span>
          </div>
        </div>

        {/* Inputs Numéricos */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col">
            <label htmlFor="preco-min" className="text-xs font-medium text-gray-700 mb-1.5">
              Mínimo
            </label>
            <input
              id="preco-min"
              type="number"
              placeholder="R$ 0"
              value={precoMin}
              onChange={(e) => handleInputChange("min", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              min={precoMinRange}
              max={precoMaxRange}
              step="1"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="preco-max" className="text-xs font-medium text-gray-700 mb-1.5">
              Máximo
            </label>
            <input
              id="preco-max"
              type="number"
              placeholder="R$ 0"
              value={precoMax}
              onChange={(e) => handleInputChange("max", e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              min={precoMinRange}
              max={precoMaxRange}
              step="1"
            />
          </div>
        </div>

        {/* Checkbox Com Desconto */}
        <div className="mb-4">
          <label className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={comDesconto}
              onChange={(e) => setComDesconto(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Com desconto
            </span>
          </label>
        </div>

        {/* Botão Limpar */}
        {(precoMin || precoMax || comDesconto) && (
          <button
            onClick={() => {
              setPrecoMin("");
              setPrecoMax("");
              setPrecoMinSlider(precoMinRange);
              setPrecoMaxSlider(precoMaxRange);
              setComDesconto(false);
              if (onPrecoChange) {
                onPrecoChange("", "");
              }
              if (onComDescontoChange) {
                onComDescontoChange(false);
              }
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200"
          >
            Limpar Filtro
          </button>
        )}
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
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

