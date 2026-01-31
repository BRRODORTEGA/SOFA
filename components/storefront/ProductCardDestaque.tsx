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
  /** URL completa do link (ex: /produto/xxx ou /produto/xxx?ref=pronta-entrega) */
  productHref?: string;
}

export function ProductCardDestaque({ produto, productHref }: ProductCardDestaqueProps) {
  const temDesconto = produto.descontoPercentual && produto.descontoPercentual > 0;
  const precoExibir = temDesconto && produto.precoComDesconto 
    ? produto.precoComDesconto 
    : produto.precoOriginal;
  const href = productHref ?? `/produto/${produto.id}`;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg"
    >
      {/* Área da imagem - quadrado proporcional (como no exemplo) */}
      {produto.imagens?.[0] ? (
        <div className="relative aspect-square w-full overflow-hidden bg-white">
          <img
            src={produto.imagens[0]}
            alt={produto.nome}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
          {/* Badge de desconto - retangular vermelho com cantos arredondados */}
          {temDesconto && (
            <div className="absolute top-2 right-2 z-10">
              <div className="rounded-md bg-red-500 px-2.5 py-1 shadow-md">
                <span className="text-xs font-bold text-white">
                  -{produto.descontoPercentual}%
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative aspect-square w-full flex items-center justify-center bg-gray-100">
          <span className="text-gray-400 text-sm">Sem imagem</span>
          {temDesconto && (
            <div className="absolute top-2 right-2 z-10">
              <div className="rounded-md bg-red-500 px-2.5 py-1 shadow-md">
                <span className="text-xs font-bold text-white">
                  -{produto.descontoPercentual}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Área de texto - nome, marca/família, preços */}
      <div className="flex flex-1 flex-col justify-end p-3">
        <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">
          {produto.nome}
        </h3>
        {produto.familia && (
          <p className="mt-0.5 text-xs text-gray-500">{produto.familia.nome}</p>
        )}
        {precoExibir !== null && precoExibir !== undefined && (
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
            {temDesconto && produto.precoOriginal && (
              <span className="text-sm text-gray-400 line-through">
                R$ {produto.precoOriginal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            <span className={`text-sm font-bold ${temDesconto ? "text-red-600" : "text-gray-900"}`}>
              R$ {precoExibir.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}


