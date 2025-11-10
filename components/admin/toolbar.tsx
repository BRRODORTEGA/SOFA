"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminToolbar({ createHref }: { createHref: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("q", q);
    params.set("offset", "0");
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <input 
          value={q} 
          onChange={(e)=>setQ(e.target.value)} 
          placeholder="Buscar..." 
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Buscar
        </button>
      </form>
      <a 
        href={createHref} 
        className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        + Novo
      </a>
    </div>
  );
}




