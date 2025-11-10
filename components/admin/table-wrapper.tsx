"use client";

import { useRouter } from "next/navigation";
import { AdminTable } from "./table";

type Column<T> = { key: keyof T | string; header: string; className?: string };
type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  basePath: string; // ex: "/admin/categorias"
  emptyText?: string;
};

export function AdminTableWrapper<T extends { id?: string }>({ columns, rows, basePath, emptyText }: Props<T>) {
  const router = useRouter();

  const handleRowClick = (row: T) => {
    router.push(`${basePath}/${row.id}`);
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

