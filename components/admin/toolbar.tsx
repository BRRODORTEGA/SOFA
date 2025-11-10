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
    <div className="mb-4 flex items-center justify-between gap-3">
      <form onSubmit={onSearch} className="flex items-center gap-2">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Buscar..." className="rounded border px-3 py-2 text-sm" />
        <button className="rounded bg-black px-3 py-2 text-sm text-white">Buscar</button>
      </form>
      <a href={createHref} className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Novo</a>
    </div>
  );
}




