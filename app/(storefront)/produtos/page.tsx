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

interface Familia {
  id: string;
  nome: string;
  _count?: { produtos: number };
}

interface Produto {
  id: string;
  nome: string;
  imagens: string[];
  familia: { nome: string } | null;
  categoria: { nome: string } | null;
  tipo: string | null;
  abertura: string | null;
  preco?: number | null;
}

export default function ProdutosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoriaIdUrl = searchParams.get("categoriaId");
  const categoriaIdsUrl = searchParams.get("categoriaIds");
  const initialCategoriaSelecionada = categoriaIdUrl
    ? [categoriaIdUrl]
    : categoriaIdsUrl
      ? categoriaIdsUrl.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosBestSellers, setProdutosBestSellers] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("default");
  const [groupBy, setGroupBy] = useState<"none" | "categoria" | "tipo" | "abertura" | "familia">("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string[]>(initialCategoriaSelecionada);
  const [familiaSelecionada, setFamiliaSelecionada] = useState<string[]>([]);
  const [precoMin, setPrecoMin] = useState<string>("");
  const [precoMax, setPrecoMax] = useState<string>("");
  const [precoMinRange, setPrecoMinRange] = useState<number>(0);
  const [precoMaxRange, setPrecoMaxRange] = useState<number>(50000);
  const comDescontoUrl = searchParams.get("comDesconto") === "true";
  const ambienteIdUrl = searchParams.get("ambienteId");
  const initialAmbienteSelecionada = ambienteIdUrl ? [ambienteIdUrl] : [];
  const [comDesconto, setComDesconto] = useState<boolean>(comDescontoUrl);
  const [ambientes, setAmbientes] = useState<{ id: string; nome: string }[]>([]);
  const [ambienteSelecionada, setAmbienteSelecionada] = useState<string[]>(initialAmbienteSelecionada);
  const [ambienteNome, setAmbienteNome] = useState<string>("");
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

  // Sincronizar ambiente da URL com o estado (ex.: ao abrir link do menu Ambientes)
  useEffect(() => {
    const ambIds = searchParams.get("ambienteIds")?.split(",").map((s) => s.trim()).filter(Boolean) ||
      (searchParams.get("ambienteId") ? [searchParams.get("ambienteId")!] : []);
    setAmbienteSelecionada(ambIds);
  }, [searchParams]);

  // Atualizar URL quando o usuário seleciona/deseleciona ambiente na sidebar (mantém filtro visível e consistente)
  const handleAmbienteChange = useCallback((ids: string[]) => {
    setAmbienteSelecionada(ids);
    const params = new URLSearchParams(searchParams.toString());
    if (ids.length > 0) {
      params.set("ambienteIds", ids.join(","));
    } else {
      params.delete("ambienteIds");
    }
    params.delete("ambienteId"); // manter apenas ambienteIds para múltiplos
    const query = params.toString();
    router.replace(query ? `/produtos?${query}` : "/produtos", { scroll: false });
  }, [searchParams, router]);

  // Sincronizar categoria da URL (ex.: ao clicar em Categorias em Destaque na home)
  useEffect(() => {
    const catId = searchParams.get("categoriaId");
    const catIds = searchParams.get("categoriaIds");
    if (catId) {
      setCategoriaSelecionada([catId]);
    } else if (catIds) {
      setCategoriaSelecionada(catIds.split(",").map((s) => s.trim()).filter(Boolean));
    } else {
      setCategoriaSelecionada([]);
    }
  }, [searchParams]);

  // Carregar nome do ambiente quando um único ambiente está selecionado (para o banner)
  useEffect(() => {
    if (ambienteSelecionada.length !== 1) {
      setAmbienteNome("");
      return;
    }
    fetch(`/api/ambientes/${ambienteSelecionada[0]}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d?.data?.nome) setAmbienteNome(d.data.nome);
        else setAmbienteNome("");
      })
      .catch(() => setAmbienteNome(""));
  }, [ambienteSelecionada]);

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

  // Carregar famílias
  useEffect(() => {
    fetch("/api/familias?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.data?.items) {
          setFamilias(d.data.items);
        }
      })
      .catch((err) => console.error("Erro ao carregar famílias:", err));
  }, []);

  // Carregar ambientes (para o filtro na sidebar)
  useEffect(() => {
    fetch("/api/ambientes?limit=200&ativo=true&comProdutosTabelaVigente=true")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && d?.data?.items) {
          setAmbientes(d.data.items);
        }
      })
      .catch((err) => console.error("Erro ao carregar ambientes:", err));
  }, []);

  // Carregar produtos
  const buscarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100"); // Limite alto para mostrar todos
      params.set("offset", "0");
      if (categoriaSelecionada.length > 0) {
        params.set("categoriaIds", categoriaSelecionada.join(","));
      }
      if (familiaSelecionada.length > 0) {
        params.set("familiaIds", familiaSelecionada.join(","));
      }
      if (ambienteSelecionada.length > 0) {
        params.set("ambienteIds", ambienteSelecionada.join(","));
      }
      if (searchQuery) {
        params.set("q", searchQuery);
      }
      // Usar comDesconto do estado ou da URL
      const comDescontoAtivo = comDesconto || comDescontoUrl;
      if (comDescontoAtivo) {
        params.set("comDesconto", "true");
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

      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res.json();

      if (data.ok && data.data?.items) {
        let produtosFiltrados = data.data.items;

        // Calcular range de preços se ainda não foi calculado
        if (produtosFiltrados.length > 0 && precoMaxRange === 50000) {
          const precos = produtosFiltrados
            .map((p: Produto) => p.preco || 0)
            .filter((p: number) => p > 0);
          
          if (precos.length > 0) {
            const min = Math.floor(Math.min(...precos) * 0.9);
            const max = Math.ceil(Math.max(...precos) * 1.1);
            setPrecoMinRange(min);
            setPrecoMaxRange(max);
          }
        }

        // Aplicar filtro de preço
        if (precoMin || precoMax) {
          const min = precoMin ? parseFloat(precoMin) : 0;
          const max = precoMax ? parseFloat(precoMax) : Infinity;
          produtosFiltrados = produtosFiltrados.filter((produto) => {
            const preco = produto.preco || 0;
            return preco >= min && preco <= max;
          });
        }

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
  }, [categoriaSelecionada, familiaSelecionada, ambienteSelecionada, searchQuery, sortBy, precoMin, precoMax, comDesconto, comDescontoUrl, filtrosOpcoes]);

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
    <div className="mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
      {(comDesconto || comDescontoUrl) && (
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Produtos em Desconto</h1>
          <p className="text-gray-600">Aproveite nossas ofertas especiais!</p>
        </div>
      )}
      {ambienteSelecionada.length === 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-gray-700">
            Ambiente: <span className="font-semibold text-gray-900">{ambienteNome || "…"}</span>
          </span>
          <a
            href="/produtos"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todos os produtos
          </a>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <ProductSidebar
          categorias={categorias}
          familias={familias}
          ambientes={ambientes}
          produtosBestSellers={produtosBestSellers}
          categoriaSelecionada={categoriaSelecionada}
          onCategoriaChange={setCategoriaSelecionada}
          familiaSelecionada={familiaSelecionada}
          onFamiliaChange={setFamiliaSelecionada}
          ambienteSelecionada={ambienteSelecionada}
          onAmbienteChange={handleAmbienteChange}
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

        {/* Área principal com grid de produtos */}
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
        />
      </div>
    </div>
  );
}

