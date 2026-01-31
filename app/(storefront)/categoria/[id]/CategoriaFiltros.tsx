"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface Produto {
  id: string;
  nome: string;
  tipo: string | null;
  abertura: string | null;
  acionamento: string | null;
  imagens: string[];
  familia: { id: string; nome: string } | null;
  categoria: { nome: string } | null;
}

interface CategoriaFiltrosProps {
  categoriaId: string;
  categoriaNome: string;
  familias: { id: string; nome: string }[];
  categorias: { id: string; nome: string }[];
  produtosIniciais: Produto[];
}

function CategoriaFiltrosContent({
  categoriaId,
  categoriaNome,
  familias,
  categorias,
  produtosIniciais,
}: CategoriaFiltrosProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Filtros - inicializar a partir dos searchParams
  const familiaIdParam = searchParams.get("familia") || "";
  const tipoParam = searchParams.get("tipo") || "";
  const aberturaParam = searchParams.get("abertura") || "";
  const acionamentoParam = searchParams.get("acionamento") || "";
  
  const [familiaId, setFamiliaId] = useState(familiaIdParam);
  const [tipo, setTipo] = useState(tipoParam);
  const [abertura, setAbertura] = useState(aberturaParam);
  const [acionamento, setAcionamento] = useState(acionamentoParam);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar valores únicos dos produtos para os filtros (usar produtos filtrados quando disponível)
  const produtosParaFiltros = produtos.length > 0 ? produtos : produtosIniciais;
  
  // Usar famílias dos produtos filtrados, ou as famílias iniciais se não houver produtos filtrados ainda
  const familiasDisponiveis = produtos.length > 0
    ? Array.from(
        new Map(
          produtos
            .map(p => p.familia)
            .filter(Boolean)
            .map(f => [f!.id, f])
        ).values()
      ).sort((a, b) => a!.nome.localeCompare(b!.nome))
    : familias;
  
  const tiposDisponiveis = Array.from(new Set(produtosParaFiltros.map(p => p.tipo).filter(Boolean))) as string[];
  const aberturasDisponiveis = Array.from(new Set(produtosParaFiltros.map(p => p.abertura).filter(Boolean))) as string[];
  const acionamentosDisponiveis = Array.from(new Set(produtosParaFiltros.map(p => p.acionamento).filter(Boolean))) as string[];

  // Função para buscar produtos filtrados
  const buscarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("categoriaId", categoriaId);
      if (familiaId) params.set("familiaId", familiaId);
      if (tipo) params.set("tipo", tipo);
      if (abertura) params.set("abertura", abertura);
      if (acionamento) params.set("acionamento", acionamento);

      const res = await fetch(`/api/produtos/filtrar?${params.toString()}`);
      const data = await res.json();
      
      if (data.ok) {
        setProdutos(data.data.items || []);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, [categoriaId, familiaId, tipo, abertura, acionamento]);

  // Buscar produtos na montagem inicial e quando filtros mudarem
  useEffect(() => {
    buscarProdutos();
  }, [buscarProdutos]);

  // Atualizar URL quando filtros mudarem (sem recarregar produtos)
  useEffect(() => {
    const params = new URLSearchParams();
    if (familiaId) params.set("familia", familiaId);
    if (tipo) params.set("tipo", tipo);
    if (abertura) params.set("abertura", abertura);
    if (acionamento) params.set("acionamento", acionamento);

    const newUrl = params.toString() 
      ? `/categoria/${categoriaId}?${params.toString()}`
      : `/categoria/${categoriaId}`;
    
    router.replace(newUrl, { scroll: false });
  }, [familiaId, tipo, abertura, acionamento, categoriaId, router]);

  const limparFiltros = () => {
    setFamiliaId("");
    setTipo("");
    setAbertura("");
    setAcionamento("");
  };

  const temFiltrosAtivos = familiaId || tipo || abertura || acionamento;

  return (
    <div className="mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{categoriaNome}</h1>
        <p className="mt-2 text-gray-600">
          {loading ? "Carregando..." : `${produtos.length} ${produtos.length === 1 ? "produto encontrado" : "produtos encontrados"}`}
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Filtro: Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={categoriaId}
              onChange={(e) => {
                router.push(`/categoria/${e.target.value}`);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Família */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Família
            </label>
            <select
              value={familiaId}
              onChange={(e) => setFamiliaId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {familiasDisponiveis.map((fam) => (
                <option key={fam!.id} value={fam!.id}>
                  {fam!.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {tiposDisponiveis.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Abertura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Abertura
            </label>
            <select
              value={abertura}
              onChange={(e) => setAbertura(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {aberturasDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro: Acionamento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Acionamento
            </label>
            <select
              value={acionamento}
              onChange={(e) => setAcionamento(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {acionamentosDisponiveis.map((ac) => (
                <option key={ac} value={ac}>
                  {ac}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Produtos */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      ) : produtos.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-gray-600">
            {temFiltrosAtivos 
              ? "Nenhum produto encontrado com os filtros selecionados."
              : "Nenhum produto encontrado nesta categoria."}
          </p>
          {temFiltrosAtivos && (
            <button
              onClick={limparFiltros}
              className="mt-4 text-blue-600 hover:underline"
            >
              Limpar filtros
            </button>
          )}
          <Link href="/" className="mt-4 block text-blue-600 hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {produtos.map((produto) => (
            <Link
              key={produto.id}
              href={`/produto/${produto.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
            >
              {produto.imagens?.[0] ? (
                <div className="relative aspect-square w-full overflow-hidden bg-white">
                  <img
                    src={produto.imagens[0]}
                    alt={produto.nome}
                    className="h-full w-full object-contain transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400 text-sm">Sem imagem</span>
                </div>
              )}
              <div className="flex flex-1 flex-col justify-end p-4">
                <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                  {produto.nome}
                </h3>
                {produto.familia && (
                  <p className="mt-0.5 text-xs text-gray-500">{produto.familia.nome}</p>
                )}
                {produto.tipo && <p className="mt-0.5 text-xs text-gray-500">{produto.tipo}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriaFiltros(props: CategoriaFiltrosProps) {
  return (
    <Suspense fallback={
      <div className="mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{props.categoriaNome}</h1>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    }>
      <CategoriaFiltrosContent {...props} />
    </Suspense>
  );
}

