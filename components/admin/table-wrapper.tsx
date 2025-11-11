"use client";

import { useRouter } from "next/navigation";
import { AdminTable } from "./table";

type Column<T> = { key: keyof T | string; header: string; className?: string };
type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  basePath: string; // ex: "/admin/categorias"
  emptyText?: string;
  customRowLink?: (row: T) => string; // Função opcional para link customizado
};

export function AdminTableWrapper<T extends { id?: string }>({ columns, rows, basePath, emptyText, customRowLink }: Props<T>) {
  const router = useRouter();

  const handleRowClick = (row: T) => {
    const link = customRowLink ? customRowLink(row) : `${basePath}/${row.id}`;
    router.push(link);
  };

  return (
    <AdminTable
      columns={columns}
      rows={rows}
      onRowClick={handleRowClick}
      emptyText={emptyText}
    />
  );
}

