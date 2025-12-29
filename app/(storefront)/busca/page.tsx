"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Produto {
  id: string;
  nome: string;
  imagens?: string[];
  categoria?: { nome: string };
  familia?: { nome: string };
  preco?: number | null;
  precoOriginal?: number | null;
  descontoPercentual?: number;
}

export default function BuscaPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      buscarProdutos();
    }
  }, [query]);

  const buscarProdutos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      params.set("offset", "0");
      params.set("q", query);

      const res = await fetch(`/api/produtos?${params.toString()}`);
      const data = await res.json();

      if (data.ok && data.data?.items) {
        setProdutos(data.data.items);
      } else {
        setProdutos([]);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

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
            ) : produtos.length > 0 ? (
              `Encontrados ${produtos.length} produto(s) para "${query}"`
            ) : (
              `Nenhum produto encontrado para "${query}"`
            )}
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : produtos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {produtos.map((produto) => (
            <Link
              key={produto.id}
              href={`/produto/${produto.id}`}
              className="group overflow-hidden rounded-lg border bg-white transition-all hover:shadow-lg"
            >
              {produto.imagens?.[0] ? (
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img
                    src={produto.imagens[0]}
                    alt={produto.nome}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">Sem imagem</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors mb-1">
                  {produto.nome}
                </h3>
                {produto.categoria && (
                  <p className="text-sm text-gray-600 mb-2">
                    {produto.categoria.nome}
                    {produto.familia && ` • ${produto.familia.nome}`}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {produto.preco !== null && produto.preco !== undefined && (
                    <>
                      {produto.precoOriginal && produto.precoOriginal > produto.preco && (
                        <span className="text-sm text-gray-500 line-through">
                          R$ {produto.precoOriginal.toFixed(2)}
                        </span>
                      )}
                      <span className="text-lg font-bold text-gray-900">
                        R$ {produto.preco.toFixed(2)}
                      </span>
                      {produto.descontoPercentual && produto.descontoPercentual > 0 && (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                          -{produto.descontoPercentual}%
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-20">
          <p className="text-gray-600 mb-4">Nenhum produto encontrado.</p>
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

