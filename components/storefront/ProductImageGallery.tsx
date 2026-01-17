"use client";

import { useState, useEffect } from "react";

interface ProductImageGalleryProps {
  imagens: string[];
  produtoNome: string;
  tecidoId?: string;
  totalFotos?: number;
}

export function ProductImageGallery({
  imagens,
  produtoNome,
  tecidoId,
  totalFotos,
}: ProductImageGalleryProps) {
  const [imagemAtual, setImagemAtual] = useState(0);

  // Resetar imagem atual quando imagens mudarem
  useEffect(() => {
    if (imagens.length > 0 && imagemAtual >= imagens.length) {
      setImagemAtual(0);
    }
  }, [imagens.length, imagemAtual]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (imagens.length <= 1) return;
      
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setImagemAtual((prev) => (prev - 1 + imagens.length) % imagens.length);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setImagemAtual((prev) => (prev + 1) % imagens.length);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [imagens.length]);

  const proximaImagem = () => {
    if (imagens.length > 1) {
      setImagemAtual((prev) => (prev + 1) % imagens.length);
    }
  };

  const imagemAnterior = () => {
    if (imagens.length > 1) {
      setImagemAtual((prev) => (prev - 1 + imagens.length) % imagens.length);
    }
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const imageWidth = rect.width;
    const clickPercentage = clickX / imageWidth;

    // Se clicar na metade esquerda (0-50%), vai para imagem anterior
    // Se clicar na metade direita (50-100%), vai para próxima imagem
    if (clickPercentage < 0.5) {
      imagemAnterior();
    } else {
      proximaImagem();
    }
  };

  if (imagens.length === 0) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-400">Sem imagem</span>
      </div>
    );
  }

  return (
    <div>
      {/* Imagem Principal com Áreas Clicáveis */}
      <div
        className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 mb-4 cursor-pointer group"
        onClick={handleImageClick}
        role="button"
        tabIndex={0}
        aria-label="Clique na esquerda para imagem anterior, direita para próxima"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            // Por padrão, vai para próxima ao pressionar Enter/Space
            proximaImagem();
          }
        }}
      >
        <img
          src={imagens[imagemAtual]}
          alt={`${produtoNome} - Imagem ${imagemAtual + 1}`}
          className="h-full w-full object-cover transition-opacity duration-300"
        />

        {/* Indicadores de Navegação - Só aparecem quando há mais de 1 imagem */}
        {imagens.length > 1 && (
          <>
            {/* Área Esquerda - Anterior */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1/2 flex items-center justify-start pl-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                imagemAnterior();
              }}
              aria-label="Imagem anterior"
            >
              <div className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Área Direita - Próxima */}
            <div
              className="absolute right-0 top-0 bottom-0 w-1/2 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                proximaImagem();
              }}
              aria-label="Próxima imagem"
            >
              <div className="bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>

            {/* Indicador de Posição */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium">
              {imagemAtual + 1} / {imagens.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imagens.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imagens.map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setImagemAtual(idx);
              }}
              className={`flex-shrink-0 rounded border-2 transition-all ${
                imagemAtual === idx
                  ? "border-primary ring-2 ring-secondary"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              aria-label={`Ver imagem ${idx + 1}`}
            >
              <img
                src={img}
                alt={`${produtoNome} thumbnail ${idx + 1}`}
                className="h-20 w-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Texto informativo sobre tecido */}
      {tecidoId && totalFotos && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          Mostrando {totalFotos} foto(s) para este tecido
        </p>
      )}
    </div>
  );
}

