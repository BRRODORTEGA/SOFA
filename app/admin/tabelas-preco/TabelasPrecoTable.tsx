"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Column<T> = { key: keyof T | string; header: string; className?: string };
type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  basePath: string;
  emptyText?: string;
};

export default function TabelasPrecoTable<T extends { id?: string }>({ columns, rows, basePath, emptyText }: Props<T>) {
  const router = useRouter();
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  const handleRowClick = (row: T) => {
    router.push(`${basePath}/${row.id}`);
  };

  const handleToggleStatus = async (e: React.MouseEvent, row: T) => {
    e.stopPropagation(); // Prevenir clique na linha
    
    if (!row.id) return;

    const currentStatus = (row as any).ativo;
    const newStatus = !currentStatus;

    setTogglingStatus(row.id);
    try {
      const res = await fetch(`/api/tabelas-preco/${row.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: newStatus }),
      });
      const result = await res.json();
      
      if (res.ok) {
        router.refresh();
      } else {
        const errorMsg = result.error || result.details || result.message || "Erro ao atualizar status";
        alert(`Erro ao atualizar status: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status. Verifique o console para mais detalhes.");
    } finally {
      setTogglingStatus(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-base">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
            {columns.map((col) => (
              <th 
                key={String(col.key)} 
                className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-base text-gray-500">
                {emptyText || "Nenhum item encontrado."}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row)}
                className="cursor-pointer bg-white transition-colors hover:bg-secondary"
              >
                {columns.map((col) => {
                  // Renderizar botão de toggle para a coluna de status
                  if (col.key === "ativoFormatted") {
                    const isActive = (row as any).ativo === true;
                    const isToggling = togglingStatus === row.id;
                    
                    return (
                      <td
                        key={String(col.key)}
                        className="border-r border-gray-200 px-4 py-3 text-sm last:border-r-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => handleToggleStatus(e, row)}
                          disabled={isToggling}
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500"
                          }`}
                        >
                          {isToggling ? "..." : isActive ? "Ativo" : "Inativo"}
                        </button>
                      </td>
                    );
                  }
                  
                  return (
                    <td key={String(col.key)} className="border-r border-gray-200 px-4 py-3 text-sm text-gray-900 last:border-r-0">
                      {String((row as any)[col.key] || "-")}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

