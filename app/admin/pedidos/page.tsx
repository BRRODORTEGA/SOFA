import { AdminToolbar } from "@/components/admin/toolbar";
import { AdminTableWrapper } from "@/components/admin/table-wrapper";
import { prisma } from "@/lib/prisma";
import DbError from "@/components/admin/db-error";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { q?: string; limit?: string; offset?: string } }) {
  const limit = Number(searchParams.limit ?? 20);
  const offset = Number(searchParams.offset ?? 0);
  const q = searchParams.q?.trim() ?? "";

  try {
    const where: any = {};
    if (q) {
      where.OR = [
        { codigo: { contains: q, mode: "insensitive" } },
        { cliente: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          cliente: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.pedido.count({ where }),
    ]);

    const rowsWithFormatted = items.map((item) => ({
      ...item,
      clienteNome: item.cliente.name || item.cliente.email,
      createdAtFormatted: new Date(item.createdAt).toLocaleDateString("pt-BR"),
      statusFormatted: item.status,
    }));

    function getStatusColor(status: string) {
      const colors: Record<string, string> = {
        Solicitado: "bg-yellow-100 text-yellow-800",
        Aprovado: "bg-blue-100 text-blue-800",
        "Em Produção": "bg-purple-100 text-purple-800",
        Expedido: "bg-green-100 text-green-800",
        Reprovado: "bg-red-100 text-red-800",
      };
      return colors[status] || "bg-gray-100 text-gray-800";
    }

    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Pedidos</h1>
        <div className="mb-6">
          <form method="get" className="flex gap-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar por código ou e-mail..."
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
            { key: "codigo", header: "Código" },
            { key: "clienteNome", header: "Cliente" },
            {
              key: "statusFormatted",
              header: "Status",
              className: "w-32",
            },
            { key: "createdAtFormatted", header: "Data" },
          ]}
          rows={rowsWithFormatted}
          basePath="/admin/pedidos"
          emptyText="Nenhum pedido encontrado"
        />
        <div className="mt-4 text-base font-medium text-gray-700">Total: <span className="font-semibold text-gray-900">{total}</span></div>
      </div>
    );
  } catch (error: any) {
    return <DbError />;
  }
}
