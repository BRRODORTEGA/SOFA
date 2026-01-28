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
    // Add 'as const' 
    const where = q ? { nome: { contains: q, mode: "insensitive" as const } } : {};
    const [items, total] = await Promise.all([
      prisma.familia.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" }, include: { categoria: { select: { nome: true } } } }),
      prisma.familia.count({ where }),
    ]);

    // Processar dados no servidor antes de passar para o Client Component
    const rowsWithFormatted = items.map(item => ({
      ...item,
      categoriaNome: item.categoria?.nome || "-",
      ativoFormatted: item.ativo ? "Sim" : "Não"
    }));

    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Famílias</h1>
        <AdminToolbar createHref="/admin/familias/new" />
        <AdminTableWrapper
          columns={[
            { key: "nome", header: "Nome" },
            { key: "categoriaNome", header: "Categoria" },
            { key: "ativoFormatted", header: "Ativo" },
          ]}
          rows={rowsWithFormatted}
          basePath="/admin/familias"
        />
        <div className="mt-4 text-base font-medium text-gray-700">Total: <span className="font-semibold text-gray-900">{total}</span></div>
      </div>
    );
  } catch (error: any) {
    return <DbError />;
  }
}
