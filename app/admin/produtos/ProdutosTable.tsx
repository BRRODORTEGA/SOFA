"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AdminTable } from "@/components/admin/table";

type Column<T> = { key: keyof T | string; header: string; className?: string };
type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  basePath: string;
  emptyText?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export default function ProdutosTable<T extends { id?: string }>({ columns, rows, basePath, emptyText, sortBy = "createdAt", sortOrder = "desc" }: Props<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSort = (columnKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Se já está ordenando por esta coluna, alternar entre asc/desc
    if (sortBy === columnKey) {
      params.set("sortOrder", sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Nova coluna, começar com desc
      params.set("sortBy", columnKey);
      params.set("sortOrder", "desc");
    }
    
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleRowClick = (row: T) => {
    router.push(`${basePath}/${row.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, row: T) => {
    e.stopPropagation(); // Prevenir clique na linha
    
    if (!row.id) return;
    
    if (!confirm(`Excluir o produto "${(row as any).nome}"?`)) return;

    setDeleting(row.id);
    try {
      const res = await fetch(`/api/produtos/${row.id}`, { method: "DELETE" });
      const result = await res.json();
      
      if (res.ok && result.ok) {
        router.refresh();
        alert("Produto excluído com sucesso!");
      } else {
        const errorMsg = result.error || result.details || result.message || "Erro ao excluir produto";
        alert(`Erro ao excluir: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto. Verifique o console para mais detalhes.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-base">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
            {columns.map((col) => {
              const isSorted = sortBy === col.key;
              const isAsc = isSorted && sortOrder === "asc";
              const isDesc = isSorted && sortOrder === "desc";
              
              return (
                <th 
                  key={String(col.key)} 
                  onClick={() => handleSort(String(col.key))}
                  className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-200 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{col.header}</span>
                    {isSorted && (
                      <span className="text-gray-500">
                        {isAsc ? "↑" : "↓"}
                      </span>
                    )}
                    {!isSorted && (
                      <span className="text-gray-300 opacity-50">⇅</span>
                    )}
                  </div>
                </th>
              );
            })}
            <th className="border-b border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-700">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-base text-gray-500">
                {emptyText || "Nenhum item encontrado."}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => handleRowClick(row)}
                className="cursor-pointer bg-white transition-colors hover:bg-blue-50"
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="border-r border-gray-200 px-4 py-3 text-sm text-gray-900 last:border-r-0">
                    {String((row as any)[col.key] || "-")}
                  </td>
                ))}
                <td 
                  className="border-r border-gray-200 px-4 py-3 text-sm last:border-r-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => handleDelete(e, row)}
                    disabled={deleting === row.id}
                    className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === row.id ? "Excluindo..." : "Excluir"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

