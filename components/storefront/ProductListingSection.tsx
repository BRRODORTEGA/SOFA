"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductSidebar } from "./ProductSidebar";
import { ProductGrid } from "./ProductGrid";

interface Categoria {
  id: string;
  nome: string;
  _count: { produtos: number };
}

interface Produto {
  id: string;
  nome: string;
  imagens: string[];
  familia: { nome: string } | null;
  categoria: { nome: string } | null;
  preco?: number | null;
  precoOriginal?: number | null;
  precoComDesconto?: number | null;
  descontoPercentual?: number;
}

interface ProductListingSectionProps {
  categorias: Categoria[];
  produtosIniciais: Produto[];
  produtosBestSellers: Produto[];
}

export function ProductListingSection({
  categorias,
  produtosIniciais,
  produtosBestSellers,
}: ProductListingSectionProps) {
  const [produtos, setProdutos] = useState<Produto[]>(produtosIniciais);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string[]>([]);
  const [precoMin, setPrecoMin] = useState<string>("");
  const [precoMax, setPrecoMax] = useState<string>("");
  const [comDesconto, setComDesconto] = useState<boolean>(false);
  const [filtrosOpcoes, setFiltrosOpcoes] = useState<{
    medidas: number[];
    tecidos: string[];
    tipos: string[];
    aberturas: string[];
    acionamentos: string[];
  }>({
    medidas: [],
    tecidos: [],
    tipos: [],
    aberturas: [],
    acionamentos: [],
  });

  // Calcular range de preços dos produtos
  const calcularRangePrecos = useCallback(() => {
    if (produtosIniciais.length === 0) return { min: 0, max: 50000 };
    
    const precos = produtosIniciais
      .map(p => p.preco || p.precoComDesconto || p.precoOriginal || 0)
      .filter(p => p > 0);
    
    if (precos.length === 0) return { min: 0, max: 50000 };
    
    const min = Math.floor(Math.min(...precos) * 0.9); // 10% abaixo do mínimo
    const max = Math.ceil(Math.max(...precos) * 1.1); // 10% acima do máximo
    
    return { min, max };
  }, [produtosIniciais]);

  const { min: precoMinRange, max: precoMaxRange } = calcularRangePrecos();

  // Função para filtrar produtos por preço
  const filtrarPorPreco = useCallback((produtosLista: Produto[], min: string, max: string): Produto[] => {
    if (!min && !max) {
      return produtosLista;
    }

    const minValue = min ? parseFloat(min) : 0;
    const maxValue = max ? parseFloat(max) : Infinity;

    return produtosLista.filter((produto) => {
      const preco = produto.preco || produto.precoComDesconto || produto.precoOriginal || 0;
      return preco >= minValue && preco <= maxValue;
    });
  }, []);

  // Carregar produtos quando filtros mudarem
  const buscarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      params.set("offset", "0");
      if (categoriaSelecionada.length > 0) {
        params.set("categoriaIds", categoriaSelecionada.join(","));
      }
      if (searchQuery) {
        params.set("q", searchQuery);
      }
      if (filtrosOpcoes.medidas.length > 0) {
        params.set("medidas", filtrosOpcoes.medidas.join(","));
      }
      if (filtrosOpcoes.tecidos.length > 0) {
        params.set("tecidos", filtrosOpcoes.tecidos.join(","));
      }
      if (filtrosOpcoes.tipos.length > 0) {
        params.set("tipos", filtrosOpcoes.tipos.join(","));
      }
      if (filtrosOpcoes.aberturas.length > 0) {
        params.set("aberturas", filtrosOpcoes.aberturas.join(","));
      }
      if (filtrosOpcoes.acionamentos.length > 0) {
        params.set("acionamentos", filtrosOpcoes.acionamentos.join(","));
      }
      if (comDesconto) {
        params.set("comDesconto", "true");
      }

      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res.json();

      if (data.ok && data.data?.items) {
        let produtosFiltrados = data.data.items;

        // Aplicar filtro de preço
        produtosFiltrados = filtrarPorPreco(produtosFiltrados, precoMin, precoMax);

        // Aplicar ordenação
        if (sortBy === "name-asc") {
          produtosFiltrados.sort((a: Produto, b: Produto) => a.nome.localeCompare(b.nome));
        } else if (sortBy === "name-desc") {
          produtosFiltrados.sort((a: Produto, b: Produto) => b.nome.localeCompare(a.nome));
        } else if (sortBy === "price-asc") {
          produtosFiltrados.sort((a: Produto, b: Produto) => (a.preco || 0) - (b.preco || 0));
        } else if (sortBy === "price-desc") {
          produtosFiltrados.sort((a: Produto, b: Produto) => (b.preco || 0) - (a.preco || 0));
        } else if (sortBy === "newest") {
          produtosFiltrados.sort((a: any, b: any) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        }

        setProdutos(produtosFiltrados);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
        setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, [categoriaSelecionada, searchQuery, sortBy, precoMin, precoMax, filtrarPorPreco, filtrosOpcoes, comDesconto]);

  // Aplicar filtros e ordenação
  useEffect(() => {
    if (categoriaSelecionada) {
      // Se há categoria selecionada, buscar da API
      buscarProdutos();
    } else if (searchQuery || precoMin || precoMax) {
      // Se há busca ou filtro de preço, filtrar produtos iniciais
      let filtrados = produtosIniciais;
      
      // Aplicar filtro de busca
      if (searchQuery) {
        filtrados = filtrados.filter(p => 
          p.nome.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Aplicar filtro de preço
      filtrados = filtrarPorPreco(filtrados, precoMin, precoMax);
      
      // Aplicar ordenação
      let produtosOrdenados = [...filtrados];
      if (sortBy === "name-asc") {
        produtosOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
      } else if (sortBy === "name-desc") {
        produtosOrdenados.sort((a, b) => b.nome.localeCompare(a.nome));
      } else if (sortBy === "price-asc") {
        produtosOrdenados.sort((a, b) => (a.preco || 0) - (b.preco || 0));
      } else if (sortBy === "price-desc") {
        produtosOrdenados.sort((a, b) => (b.preco || 0) - (a.preco || 0));
      }
      
      setProdutos(produtosOrdenados);
    } else {
      // Sem filtros, apenas ordenar produtos iniciais
      let produtosOrdenados = [...produtosIniciais];
      if (sortBy === "name-asc") {
        produtosOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
      } else if (sortBy === "name-desc") {
        produtosOrdenados.sort((a, b) => b.nome.localeCompare(a.nome));
      } else if (sortBy === "price-asc") {
        produtosOrdenados.sort((a, b) => (a.preco || 0) - (b.preco || 0));
      } else if (sortBy === "price-desc") {
        produtosOrdenados.sort((a, b) => (b.preco || 0) - (a.preco || 0));
      }
      setProdutos(produtosOrdenados);
    }
  }, [categoriaSelecionada, searchQuery, sortBy, precoMin, precoMax, buscarProdutos, produtosIniciais, filtrarPorPreco]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <ProductSidebar
        categorias={categorias}
        produtosBestSellers={produtosBestSellers}
        categoriaSelecionada={categoriaSelecionada}
        onCategoriaChange={setCategoriaSelecionada}
        precoMin={precoMin}
        precoMax={precoMax}
        onPrecoChange={(min, max) => {
          setPrecoMin(min);
          setPrecoMax(max);
        }}
        precoMinRange={precoMinRange}
        precoMaxRange={precoMaxRange}
        comDesconto={comDesconto}
        onComDescontoChange={setComDesconto}
        onOpcoesChange={setFiltrosOpcoes}
      />

      {/* Grid de Produtos */}
      <ProductGrid
        produtos={produtos}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
}

