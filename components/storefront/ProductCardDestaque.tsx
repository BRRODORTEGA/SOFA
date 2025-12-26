"use client";

import Link from "next/link";

interface ProdutoDestaque {
  id: string;
  nome: string;
  imagens: string[];
  familia?: { nome: string } | null;
  categoria?: { nome: string } | null;
  precoOriginal?: number | null;
  precoComDesconto?: number | null;
  descontoPercentual?: number;
}

interface ProductCardDestaqueProps {
  produto: ProdutoDestaque;
}

export function ProductCardDestaque({ produto }: ProductCardDestaqueProps) {
  const temDesconto = produto.descontoPercentual && produto.descontoPercentual > 0;
  const precoExibir = temDesconto && produto.precoComDesconto 
    ? produto.precoComDesconto 
    : produto.precoOriginal;

  return (
    <Link
      href={`/produto/${produto.id}`}
      className="group relative overflow-hidden rounded-lg border bg-white transition-all hover:shadow-lg"
    >
      {/* Badge de desconto */}
      {temDesconto && (
        <div className="absolute top-2 right-2 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
          -{produto.descontoPercentual}%
        </div>
      )}

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
        {precoExibir !== null && precoExibir !== undefined && (
          <div className="mt-2 flex items-baseline gap-2">
            {temDesconto && produto.precoOriginal && (
              <span className="text-sm text-gray-500 line-through">
                R$ {produto.precoOriginal.toFixed(2)}
              </span>
            )}
            <span className={`font-bold ${temDesconto ? 'text-red-600' : 'text-gray-900'} text-lg`}>
              R$ {precoExibir.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}


