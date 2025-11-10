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
    <div className="overflow-x-auto rounded border">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-left">
            {columns.map((c) => (
              <th key={String(c.key)} className={`px-3 py-2 font-medium ${c.className || ""}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">{emptyText}</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={String((r as any).id ?? i)} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => onRowClick?.(r)}>
              {columns.map((c) => (
                <td key={String(c.key)} className="px-3 py-2">{c.render ? c.render(r) : String((r as any)[c.key] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}




