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
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");

  // Carregar produtos quando filtros mudarem
  const buscarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      params.set("offset", "0");
      if (categoriaSelecionada) {
        params.set("categoriaId", categoriaSelecionada);
      }
      if (searchQuery) {
        params.set("q", searchQuery);
      }

      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res.json();

      if (data.ok && data.data?.items) {
        let produtosFiltrados = data.data.items;

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
  }, [categoriaSelecionada, searchQuery, sortBy]);

  // Aplicar filtros e ordenação
  useEffect(() => {
    if (categoriaSelecionada) {
      // Se há categoria selecionada, buscar da API
      buscarProdutos();
    } else if (searchQuery) {
      // Se há busca mas não categoria, filtrar produtos iniciais
      const filtrados = produtosIniciais.filter(p => 
        p.nome.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
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
  }, [categoriaSelecionada, searchQuery, sortBy, buscarProdutos, produtosIniciais]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <ProductSidebar
        categorias={categorias}
        produtosBestSellers={produtosBestSellers}
        categoriaSelecionada={categoriaSelecionada}
        onCategoriaChange={setCategoriaSelecionada}
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

