"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type AdminToolbarProps = {
  createHref?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
};

export function AdminToolbar({ 
  createHref, 
  searchValue, 
  onSearchChange, 
  searchPlaceholder = "Buscar..." 
}: AdminToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");

  // Se searchValue e onSearchChange forem fornecidos, usar controle controlado
  const isControlled = searchValue !== undefined && onSearchChange !== undefined;

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (isControlled) {
      // Se for controlado, não fazer nada aqui (o componente pai controla)
      return;
    }
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("q", q);
    params.set("offset", "0");
    router.push(`?${params.toString()}`);
  }

  if (isControlled) {
    // Versão controlada (para tabelas de preço)
    return (
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <input 
            type="text"
            value={searchValue || ""} 
            onChange={(e) => onSearchChange?.(e.target.value)} 
            placeholder={searchPlaceholder} 
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" 
            autoComplete="off"
          />
        </div>
        {createHref && (
          <a 
            href={createHref} 
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            + Novo
          </a>
        )}
      </div>
    );
  }

  // Versão não controlada (padrão para outras páginas)
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <input 
          value={q} 
          onChange={(e)=>setQ(e.target.value)} 
          placeholder={searchPlaceholder} 
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" 
        />
        <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-domux-burgundy-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          Buscar
        </button>
      </form>
      {createHref && (
        <a 
          href={createHref} 
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          + Novo
        </a>
      )}
    </div>
  );
}




