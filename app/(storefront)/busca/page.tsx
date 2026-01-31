"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Produto {
  id: string;
  nome: string;
  imagens?: string[];
  categoria?: { id: string; nome: string };
  familia?: { id: string; nome: string };
  preco?: number | null;
  precoOriginal?: number | null;
  precoComDesconto?: number | null;
  descontoPercentual?: number;
}

interface Categoria {
  id: string;
  nome: string;
}

interface Familia {
  id: string;
  nome: string;
}

export default function BuscaPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [familias, setFamilias] = useState<Familia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      buscarTudo();
    }
  }, [query]);

  const buscarTudo = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("q", query);

      const res = await fetch(`/api/busca?${params.toString()}`);
      const data = await res.json();

      if (data.ok && data.data) {
        setProdutos(data.data.produtos || []);
        setCategorias(data.data.categorias || []);
        setFamilias(data.data.familias || []);
      } else {
        setProdutos([]);
        setCategorias([]);
        setFamilias([]);
      }
    } catch (error) {
      console.error("Erro ao buscar:", error);
      setProdutos([]);
      setCategorias([]);
      setFamilias([]);
    } finally {
      setLoading(false);
    }
  };

  const total = produtos.length + categorias.length + familias.length;

  return (
    <div className="mx-auto w-full px-4 md:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Resultados da Busca
        </h1>
        {query && (
          <p className="text-gray-600">
            {loading ? (
              "Buscando..."
            ) : total > 0 ? (
              `Encontrados ${total} resultado(s) para "${query}"`
            ) : (
              `Nenhum resultado encontrado para "${query}"`
            )}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : total > 0 ? (
        <div className="space-y-8">
          {/* Categorias */}
          {categorias.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Categorias ({categorias.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categorias.map((categoria) => (
                  <Link
                    key={categoria.id}
                    href={`/categoria/${categoria.id}`}
                    className="group p-4 rounded-lg border bg-white hover:border-primary hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {categoria.nome}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Famílias */}
          {familias.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Famílias ({familias.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {familias.map((familia) => (
                  <Link
                    key={familia.id}
                    href={`/produtos?familiaIds=${familia.id}`}
                    className="group p-4 rounded-lg border bg-white hover:border-primary hover:shadow-md transition-all"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {familia.nome}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Produtos */}
          {produtos.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Produtos ({produtos.length})</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {produtos.map((produto) => (
                  <Link
                    key={produto.id}
                    href={`/produto/${produto.id}`}
                    className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg"
                  >
                    {produto.imagens?.[0] ? (
                      <div className="relative aspect-square w-full overflow-hidden bg-white">
                        <img
                          src={produto.imagens[0]}
                          alt={produto.nome}
                          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        {produto.descontoPercentual && produto.descontoPercentual > 0 && (
                          <div className="absolute top-2 right-2 z-10 rounded-md bg-red-500 px-2.5 py-1 shadow-md">
                            <span className="text-xs font-bold text-white">
                              -{produto.descontoPercentual}%
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative aspect-square w-full flex items-center justify-center bg-gray-100">
                        <span className="text-gray-400 text-sm">Sem imagem</span>
                        {produto.descontoPercentual && produto.descontoPercentual > 0 && (
                          <div className="absolute top-2 right-2 z-10 rounded-md bg-red-500 px-2.5 py-1 shadow-md">
                            <span className="text-xs font-bold text-white">-{produto.descontoPercentual}%</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-end p-3">
                      <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">
                        {produto.nome}
                      </h3>
                      {produto.categoria && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {produto.categoria.nome}
                          {produto.familia && ` • ${produto.familia.nome}`}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-baseline gap-2">
                        {produto.precoComDesconto !== null && produto.precoComDesconto !== undefined ? (
                          <>
                            {produto.precoOriginal && produto.precoOriginal > produto.precoComDesconto && (
                              <span className="text-sm text-gray-400 line-through">
                                R$ {produto.precoOriginal.toFixed(2)}
                              </span>
                            )}
                            <span className="font-bold text-red-600">
                              R$ {produto.precoComDesconto.toFixed(2)}
                            </span>
                          </>
                        ) : produto.precoOriginal !== null && produto.precoOriginal !== undefined ? (
                          <span className="font-bold text-gray-900">
                            R$ {produto.precoOriginal.toFixed(2)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : query ? (
        <div className="text-center py-20">
          <p className="text-gray-600 mb-4">Nenhum resultado encontrado.</p>
          <Link
            href="/produtos"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Ver Todos os Produtos
          </Link>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-600">Digite um termo de busca na barra de pesquisa.</p>
        </div>
      )}
    </div>
  );
}

