"use client";

import { useState, useEffect, useCallback } from "react";
import { ProductSidebar } from "@/components/storefront/ProductSidebar";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { useSearchParams, useRouter } from "next/navigation";

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
}

export default function ProdutosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosBestSellers, setProdutosBestSellers] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("default");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");

  // Carregar categorias
  useEffect(() => {
    fetch("/api/categorias?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.data?.items) {
          setCategorias(d.data.items);
        }
      })
      .catch((err) => console.error("Erro ao carregar categorias:", err));
  }, []);

  // Carregar produtos
  const buscarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100"); // Limite alto para mostrar todos
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

  // Carregar best sellers
  useEffect(() => {
    fetch("/api/produtos?limit=3")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.data?.items) {
          setProdutosBestSellers(d.data.items.slice(0, 3));
        }
      })
      .catch((err) => console.error("Erro ao carregar best sellers:", err));
  }, []);

  useEffect(() => {
    buscarProdutos();
  }, [buscarProdutos]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <ProductSidebar
          categorias={categorias}
          produtosBestSellers={produtosBestSellers}
          categoriaSelecionada={categoriaSelecionada}
          onCategoriaChange={setCategoriaSelecionada}
        />

        {/* Área principal com grid de produtos */}
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
    </div>
  );
}

