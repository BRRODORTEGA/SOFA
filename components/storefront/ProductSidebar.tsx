"use client";

import Link from "next/link";
import { useState } from "react";

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

interface ProductSidebarProps {
  categorias: Categoria[];
  produtosBestSellers?: ProdutoBestSeller[];
  categoriaSelecionada?: string;
  onCategoriaChange?: (categoriaId: string) => void;
}

export function ProductSidebar({
  categorias,
  produtosBestSellers = [],
  categoriaSelecionada,
  onCategoriaChange,
}: ProductSidebarProps) {
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");

  const cores = [
    { nome: "Preto", cor: "bg-black" },
    { nome: "Branco", cor: "bg-white border border-gray-300" },
    { nome: "Marrom Escuro", cor: "bg-amber-900" },
    { nome: "Laranja", cor: "bg-orange-500" },
    { nome: "Amarelo Claro", cor: "bg-yellow-200" },
    { nome: "Bege", cor: "bg-amber-100" },
  ];

  return (
    <aside className="w-full lg:w-80 space-y-8 pr-4">
      {/* CATEGORIES */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">Categorias</h3>
        <ul className="space-y-2">
          {categorias.map((cat) => {
            const count = cat._count?.produtos || 0;
            const isSelected = categoriaSelecionada === cat.id;
            return (
              <li key={cat.id}>
                {onCategoriaChange ? (
                  <button
                    onClick={() => onCategoriaChange(cat.id)}
                    className={`w-full text-left text-sm font-medium transition-colors ${
                      isSelected
                        ? "text-primary font-semibold"
                        : "text-gray-600 hover:text-primary"
                    }`}
                  >
                    {cat.nome} ({count})
                  </button>
                ) : (
                  <Link
                    href={`/categoria/${cat.id}`}
                    className={`text-sm font-medium transition-colors ${
                      isSelected
                        ? "text-primary font-semibold"
                        : "text-gray-600 hover:text-primary"
                    }`}
                  >
                    {cat.nome} ({count})
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* FILTER BY PRICE */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">Filtro por Preço</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={precoMin}
              onChange={(e) => setPrecoMin(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max"
              value={precoMax}
              onChange={(e) => setPrecoMax(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="w-full rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 transition-colors">
            Filtrar
          </button>
        </div>
      </div>

      {/* FILTER BY COLOR */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase">Filtro por Cor</h3>
        <div className="flex flex-wrap gap-3">
          {cores.map((cor, idx) => (
            <button
              key={idx}
              className={`w-10 h-10 rounded-full ${cor.cor} hover:ring-2 hover:ring-gray-400 transition-all`}
              title={cor.nome}
              aria-label={cor.nome}
            />
          ))}
        </div>
      </div>

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
                  {produto.preco !== undefined && (
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

