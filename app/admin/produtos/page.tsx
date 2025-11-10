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
      prisma.produto.findMany({ where, take: limit, skip: offset, orderBy: { createdAt: "desc" }, include: { categoria: { select: { nome: true } }, familia: { select: { nome: true } } } }),
      prisma.produto.count({ where }),
    ]);

    // Processar dados no servidor antes de passar para o Client Component
    const rowsWithFormatted = items.map(item => ({
      ...item,
      categoriaNome: item.categoria?.nome || "-",
      familiaNome: item.familia?.nome || "-",
      statusFormatted: item.status ? "Ativo" : "Inativo"
    }));

    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Produtos</h1>
        <AdminToolbar createHref="/admin/produtos/new" />
        <AdminTableWrapper
          columns={[
            { key: "nome", header: "Nome" },
            { key: "categoriaNome", header: "Categoria" },
            { key: "familiaNome", header: "Família" },
            { key: "statusFormatted", header: "Status" },
          ]}
          rows={rowsWithFormatted}
          basePath="/admin/produtos"
        />
        <div className="mt-4 text-base font-medium text-gray-700">Total: <span className="font-semibold text-gray-900">{total}</span></div>
      </div>
    );
  } catch (error: any) {
    return <DbError />;
  }
}
