"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ProductSidebar } from "@/components/storefront/ProductSidebar";
import Link from "next/link";

interface Produto {
  id: string;
  nome: string;
  imagens: string[];
  familia: { id?: string; nome: string } | null;
  categoria: { id?: string; nome: string } | null;
  tipo: string | null;
  abertura: string | null;
  preco?: number | null;
  precoOriginal?: number | null;
  precoComDesconto?: number | null;
  descontoPercentual?: number;
}

interface CategoriaSidebar {
  id: string;
  nome: string;
  _count: { produtos: number };
}

interface FamiliaSidebar {
  id: string;
  nome: string;
  _count: { produtos: number };
}

export default function ProntaEntregaPage() {
  const [dataProdutos, setDataProdutos] = useState<Produto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("default");
  const [groupBy, setGroupBy] = useState<"none" | "categoria" | "tipo" | "abertura" | "familia">("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string[]>([]);
  const [familiaSelecionada, setFamiliaSelecionada] = useState<string[]>([]);
  const [ambienteSelecionada, setAmbienteSelecionada] = useState<string[]>([]);
  const [ambientes, setAmbientes] = useState<{ id: string; nome: string }[]>([]);
  const [precoMin, setPrecoMin] = useState<string>("");
  const [precoMax, setPrecoMax] = useState<string>("");
  const [precoMinRange, setPrecoMinRange] = useState(0);
  const [precoMaxRange, setPrecoMaxRange] = useState(50000);

  const buscarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("prontaEntrega", "true");
      params.set("limit", "200");
      params.set("offset", "0");
      if (categoriaSelecionada.length > 0) params.set("categoriaIds", categoriaSelecionada.join(","));
      if (familiaSelecionada.length > 0) params.set("familiaIds", familiaSelecionada.join(","));
      if (ambienteSelecionada.length > 0) params.set("ambienteIds", ambienteSelecionada.join(","));

      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res.json();

      if (data.ok && data.data?.items) {
        const items = data.data.items as Produto[];
        setDataProdutos(items);

        if (items.length > 0 && precoMaxRange === 50000) {
          const precos = items.map((p) => p.preco || 0).filter((p) => p > 0);
          if (precos.length > 0) {
            const min = Math.floor(Math.min(...precos) * 0.9);
            const max = Math.ceil(Math.max(...precos) * 1.1);
            setPrecoMinRange(min);
            setPrecoMaxRange(max);
          }
        }
      } else {
        setDataProdutos([]);
      }
    } catch {
      setDataProdutos([]);
    } finally {
      setLoading(false);
    }
  }, [categoriaSelecionada, familiaSelecionada, ambienteSelecionada]);

  useEffect(() => {
    buscarProdutos();
  }, [buscarProdutos]);

  useEffect(() => {
    fetch("/api/ambientes?ativo=true&limit=100&comProdutosProntaEntrega=true")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.data?.items) setAmbientes(data.data.items);
      })
      .catch(() => setAmbientes([]));
  }, []);

  const categoriasSidebar = useMemo((): CategoriaSidebar[] => {
    const map = new Map<string, { nome: string; count: number }>();
    dataProdutos.forEach((p) => {
      const cat = p.categoria;
      if (cat && (cat as { id?: string }).id) {
        const id = (cat as { id: string }).id;
        const nome = cat.nome || "Sem categoria";
        const prev = map.get(id);
        map.set(id, { nome, count: prev ? prev.count + 1 : 1 });
      }
    });
    return Array.from(map.entries()).map(([id, { nome, count }]) => ({
      id,
      nome,
      _count: { produtos: count },
    }));
  }, [dataProdutos]);

  const familiasSidebar = useMemo((): FamiliaSidebar[] => {
    const map = new Map<string, { nome: string; count: number }>();
    dataProdutos.forEach((p) => {
      const fam = p.familia;
      if (fam && (fam as { id?: string }).id) {
        const id = (fam as { id: string }).id;
        const nome = fam.nome || "Sem família";
        const prev = map.get(id);
        map.set(id, { nome, count: prev ? prev.count + 1 : 1 });
      }
    });
    return Array.from(map.entries()).map(([id, { nome, count }]) => ({
      id,
      nome,
      _count: { produtos: count },
    }));
  }, [dataProdutos]);

  useEffect(() => {
    let lista = [...dataProdutos];

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      lista = lista.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.familia?.nome?.toLowerCase().includes(q) ||
          p.categoria?.nome?.toLowerCase().includes(q)
      );
    }

    if (precoMin || precoMax) {
      const min = precoMin ? parseFloat(precoMin) : 0;
      const max = precoMax ? parseFloat(precoMax) : Infinity;
      lista = lista.filter((p) => {
        const preco = p.preco || 0;
        return preco >= min && preco <= max;
      });
    }

    if (sortBy === "name-asc") lista.sort((a, b) => a.nome.localeCompare(b.nome));
    else if (sortBy === "name-desc") lista.sort((a, b) => b.nome.localeCompare(a.nome));
    else if (sortBy === "price-asc") lista.sort((a, b) => (a.preco || 0) - (b.preco || 0));
    else if (sortBy === "price-desc") lista.sort((a, b) => (b.preco || 0) - (a.preco || 0));

    setProdutos(lista);
  }, [dataProdutos, searchQuery, sortBy, precoMin, precoMax]);

  return (
    <div className="mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Produtos a Pronta Entrega
        </h1>
        <p className="text-gray-600 max-w-2xl">
          Confira os itens disponíveis em estoque para entrega imediata. Escolha o produto, tecido e medida e receba com agilidade.
        </p>
      </div>

      {loading && dataProdutos.length === 0 ? (
        <div className="py-16 text-center text-gray-500">
          Carregando produtos...
        </div>
      ) : dataProdutos.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <p className="text-gray-600 mb-4">
            No momento não há produtos com estoque a pronta entrega.
          </p>
          <Link
            href="/produtos"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Ver toda a coleção
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <ProductSidebar
            categorias={categoriasSidebar}
            familias={familiasSidebar}
            ambientes={ambientes}
            categoriaSelecionada={categoriaSelecionada}
            onCategoriaChange={setCategoriaSelecionada}
            familiaSelecionada={familiaSelecionada}
            onFamiliaChange={setFamiliaSelecionada}
            ambienteSelecionada={ambienteSelecionada}
            onAmbienteChange={setAmbienteSelecionada}
            precoMin={precoMin}
            precoMax={precoMax}
            onPrecoChange={(min, max) => {
              setPrecoMin(min);
              setPrecoMax(max);
            }}
            precoMinRange={precoMinRange}
            precoMaxRange={precoMaxRange}
            showOnlyBasicFilters
          />
          <ProductGrid
            produtos={produtos}
            loading={loading}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={setSortBy}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            productLinkQuery="ref=pronta-entrega"
          />
        </div>
      )}
    </div>
  );
}
