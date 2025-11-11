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
    const where = q
      ? {
          OR: [
            { nome: { contains: q, mode: "insensitive" } },
            { descricao: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.tabelaPreco.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { linhas: true },
          },
        },
      }),
      prisma.tabelaPreco.count({ where }),
    ]);

    // Processar dados no servidor antes de passar para o Client Component
    const rowsWithFormatted = items.map(item => ({
      ...item,
      ativoFormatted: item.ativo ? "Ativo" : "Inativo",
      totalLinhas: item._count.linhas,
    }));

    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Gestão de Tabelas de Preços</h1>
        <AdminToolbar createHref="/admin/tabelas-preco/new" />
        <AdminTableWrapper
          columns={[
            { key: "nome", header: "Nome" },
            { key: "ativoFormatted", header: "Status" },
            { key: "totalLinhas", header: "Total de Linhas" },
            { key: "descricao", header: "Descrição" },
          ]}
          rows={rowsWithFormatted}
          basePath="/admin/tabelas-preco"
        />
        <div className="mt-4 text-base font-medium text-gray-700">Total: <span className="font-semibold text-gray-900">{total}</span></div>
      </div>
    );
  } catch (error: any) {
    return <DbError />;
  }
}


