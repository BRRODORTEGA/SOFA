"use client";

import { useRouter, useSearchParams } from "next/navigation";

type StatusFilterProps = {
  currentStatus?: string;
};

export function StatusFilter({ currentStatus }: StatusFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    
    if (status === "todos" || !status) {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    
    params.set("offset", "0"); // Reset paginação ao mudar filtro
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Filtrar por:</span>
      <div className="flex gap-1 rounded-lg border border-gray-300 bg-white p-1 shadow-sm">
        <button
          onClick={() => handleStatusChange("todos")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            !currentStatus || currentStatus === "todos"
              ? "bg-primary text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => handleStatusChange("ativo")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            currentStatus === "ativo"
              ? "bg-green-600 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Ativos
        </button>
        <button
          onClick={() => handleStatusChange("inativo")}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
            currentStatus === "inativo"
              ? "bg-gray-600 text-white shadow-sm"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          Inativos
        </button>
      </div>
    </div>
  );
}

