"use client";

type Column<T> = { key: keyof T | string; header: string; render?: (row: T) => React.ReactNode; className?: string };
type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyText?: string;
};

export function AdminTable<T extends { id?: string }>({ columns, rows, onRowClick, emptyText = "Nenhum registro" }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full text-base">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-left">
            {columns.map((c) => (
              <th key={String(c.key)} className={`px-4 py-3 text-sm font-semibold text-gray-700 ${c.className || ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-base text-gray-500">{emptyText}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={String((r as any).id ?? i)} className="bg-white transition-colors hover:bg-secondary cursor-pointer" onClick={() => onRowClick?.(r)}>
              {columns.map((c) => (
                <td key={String(c.key)} className="px-4 py-3 text-sm text-gray-900">{c.render ? c.render(r) : String((r as any)[c.key] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}




