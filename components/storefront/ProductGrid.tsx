"use client";

import Link from "next/link";
import { useState } from "react";
import { ProductCardDestaque } from "./ProductCardDestaque";

interface Produto {
  id: string;
  nome: string;
  imagens: string[];
  familia?: { nome: string } | null;
  categoria?: { nome: string } | null;
  preco?: number | null;
  precoOriginal?: number | null;
  precoComDesconto?: number | null;
  descontoPercentual?: number;
}

interface ProductGridProps {
  produtos: Produto[];
  loading?: boolean;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  sortBy?: string;
  onSortChange?: (sort: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function ProductGrid({
  produtos,
  loading = false,
  viewMode = "grid",
  onViewModeChange,
  sortBy = "default",
  onSortChange,
  searchQuery = "",
  onSearchChange,
}: ProductGridProps) {
  return (
    <div className="flex-1">
      {/* Barra de busca e controles */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Busca */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Controles de visualização e ordenação */}
        <div className="flex items-center gap-3">
          {/* Botões de visualização */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => onViewModeChange?.("grid")}
              className={`p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="Visualização em grade"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange?.("list")}
              className={`p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              aria-label="Visualização em lista"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Ordenar por:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange?.(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="default">Padrão</option>
              <option value="name-asc">Nome: A-Z</option>
              <option value="name-desc">Nome: Z-A</option>
              <option value="price-asc">Preço: Menor para Maior</option>
              <option value="price-desc">Preço: Maior para Menor</option>
              <option value="newest">Mais recentes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid/List de produtos */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      ) : produtos.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-gray-600">Nenhum produto encontrado.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((produto) => {
            // Se tiver desconto, usar ProductCardDestaque, senão usar ProductCard normal
            if (produto.descontoPercentual && produto.descontoPercentual > 0) {
              return <ProductCardDestaque key={produto.id} produto={produto} />;
            }
            return <ProductCard key={produto.id} produto={produto} />;
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {produtos.map((produto) => (
            <ProductListItem key={produto.id} produto={produto} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ produto }: { produto: Produto }) {
  return (
    <Link
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
        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
          {produto.nome}
        </h3>
        {produto.familia && (
          <p className="mt-1 text-sm text-gray-600">{produto.familia.nome}</p>
        )}
        {produto.preco !== null && produto.preco !== undefined && typeof produto.preco === 'number' && (
          <p className="mt-2 text-lg font-bold text-gray-900">
            R$ {produto.preco.toFixed(2)}
          </p>
        )}
      </div>
    </Link>
  );
}

function ProductListItem({ produto }: { produto: Produto }) {
  return (
    <Link
      href={`/produto/${produto.id}`}
      className="group flex gap-4 rounded-lg border bg-white p-4 transition-all hover:shadow-lg"
    >
      {produto.imagens?.[0] ? (
        <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={produto.imagens[0]}
            alt={produto.nome}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="w-32 h-32 flex-shrink-0 rounded-lg bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Sem imagem</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
          {produto.nome}
        </h3>
        {produto.familia && (
          <p className="mt-1 text-sm text-gray-600">{produto.familia.nome}</p>
        )}
        {produto.categoria && (
          <p className="mt-1 text-xs text-gray-500">{produto.categoria.nome}</p>
        )}
        {produto.preco !== null && produto.preco !== undefined && typeof produto.preco === 'number' && (
          <p className="mt-2 text-lg font-bold text-gray-900">
            R$ {produto.preco.toFixed(2)}
          </p>
        )}
      </div>
    </Link>
  );
}



