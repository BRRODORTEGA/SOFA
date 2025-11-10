import { AdminToolbar } from "@/components/admin/toolbar";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { prisma } from "@/lib/prisma";
import DbError from "@/components/admin/db-error";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { q?: string; limit?: string; offset?: string } }) {
  const limit = Number(searchParams.limit ?? 20);
  const offset = Number(searchParams.offset ?? 0);
  const q = searchParams.q?.trim() ?? "";

  try {
    const where = q ? { nome: { contains: q, mode: "insensitive" } } : {};
    const [items, total] = await Promise.all([
      prisma.tecido.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" } }),
      prisma.tecido.count({ where }),
    ]);

    // Processar dados no servidor antes de passar para o Client Component
    const rowsWithFormatted = items.map(item => ({
      ...item,
      ativoFormatted: item.ativo ? "Sim" : "Não"
    }));

    return (
      <div>
        <AdminToolbar createHref="/admin/tecidos/new" />
        <AdminTableWrapper
          columns={[
            { key: "nome", header: "Nome" },
            { key: "grade", header: "Grade" },
            { key: "ativoFormatted", header: "Ativo" },
          ]}
          rows={rowsWithFormatted}
          basePath="/admin/tecidos"
        />
        <div className="mt-3 text-sm text-gray-600">Total: {total}</div>
      </div>
    );
  } catch (error: any) {
    return <DbError />;
  }
}
