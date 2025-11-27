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
    const where: any = {
      role: "CLIENTE", // Apenas clientes
    };
    
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerificado: true,
          createdAt: true,
          _count: {
            select: {
              pedidos: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Processar dados no servidor antes de passar para o Client Component
    const rowsWithFormatted = items.map((item) => ({
      ...item,
      nomeFormatted: item.name || "-",
      emailVerificadoFormatted: item.emailVerificado ? "Sim" : "Não",
      totalPedidos: item._count.pedidos || 0,
      createdAtFormatted: new Date(item.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    }));

    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Clientes</h1>
        <div className="mb-6">
          <form method="get" className="flex gap-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por nome ou e-mail..."
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              type="submit" 
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Buscar
            </button>
          </form>
        </div>
        <AdminTableWrapper
          columns={[
            { key: "nomeFormatted", header: "Nome" },
            { key: "email", header: "E-mail" },
            { key: "emailVerificadoFormatted", header: "E-mail Verificado" },
            { key: "totalPedidos", header: "Total de Pedidos" },
            { key: "createdAtFormatted", header: "Data de Cadastro" },
          ]}
          rows={rowsWithFormatted}
          basePath="/admin/clientes"
          emptyText="Nenhum cliente encontrado"
        />
        <div className="mt-4 text-base font-medium text-gray-700">Total: <span className="font-semibold text-gray-900">{total}</span></div>
      </div>
    );
  } catch (error: any) {
    return <DbError />;
  }
}

