import { AdminToolbar } from "@/components/admin/toolbar";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { prisma } from "@/lib/prisma";
import DbError from "@/components/admin/db-error";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { q?: string; limit?: string; offset?: string } }) {
  const limit = Number(searchParams.limit ?? 50);
  const offset = Number(searchParams.offset ?? 0);
  const q = searchParams.q?.trim() ?? "";

  try {
    const where = q ? { nome: { contains: q, mode: "insensitive" } } : {};
    const [items, total] = await Promise.all([
      prisma.nomePadraoProduto.findMany({ 
        where, 
        take: limit, 
        skip: offset, 
        orderBy: [
          { ordem: "asc" },
          { nome: "asc" },
        ],
      }),
      prisma.nomePadraoProduto.count({ where }),
    ]);

    // Processar dados no servidor antes de passar para o Client Component
    const rowsWithFormatted = items.map(item => ({
      ...item,
      ativoFormatted: item.ativo ? "Sim" : "Não",
      ordemFormatted: item.ordem?.toString() || "-",
    }));

    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Nomes Padrão de Produtos</h1>
        <AdminToolbar createHref="/admin/nomes-padrao-produto/new" />
        <AdminTableWrapper
          columns={[
            { key: "ordemFormatted", header: "Ordem" },
            { key: "nome", header: "Nome" },
            { key: "ativoFormatted", header: "Ativo" },
          ]}
          rows={rowsWithFormatted}
          basePath="/admin/nomes-padrao-produto"
        />
        <div className="mt-4 text-base font-medium text-gray-700">Total: <span className="font-semibold text-gray-900">{total}</span></div>
      </div>
    );
  } catch (error: any) {
    return <DbError />;
  }
}

