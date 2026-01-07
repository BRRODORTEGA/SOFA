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

    // Função para garantir que a coluna ultimaVisualizacaoAdmin existe
    try {
      const columnExists = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = 'Pedido' 
         AND column_name = 'ultimaVisualizacaoAdmin'`
      );
      
      if (columnExists.length === 0) {
        await prisma.$executeRawUnsafe(
          `DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'public' 
              AND table_name = 'Pedido' 
              AND column_name = 'ultimaVisualizacaoAdmin'
            ) THEN
              ALTER TABLE "Pedido" ADD COLUMN "ultimaVisualizacaoAdmin" TIMESTAMP(3);
            END IF;
          END $$;`
        );
        console.log("Coluna ultimaVisualizacaoAdmin criada com sucesso");
      }
    } catch (e: any) {
      console.log("Erro ao verificar/criar coluna ultimaVisualizacaoAdmin:", e?.message);
    }

    // Buscar pedidos usando include primeiro para evitar erro se a coluna não existir ainda
    const pedidosRaw = await prisma.pedido.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        cliente: { select: { id: true, name: true, email: true } },
        mensagens: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            role: true,
            createdAt: true,
          },
          // Buscar todas as mensagens para verificar se há alguma nova do cliente
        },
      },
    });

    const total = await prisma.pedido.count({ where });

    // Mapear os resultados incluindo ultimaVisualizacaoAdmin se disponível
    const items = pedidosRaw.map((item: any) => ({
      id: item.id,
      codigo: item.codigo,
      status: item.status,
      createdAt: item.createdAt,
      ultimaVisualizacaoAdmin: item.ultimaVisualizacaoAdmin || null,
      cliente: item.cliente,
      mensagens: item.mensagens,
    }));

    const rowsWithFormatted = items.map((item) => {
      // Verificar se há nova mensagem do cliente não visualizada pelo admin
      // Buscar todas as mensagens do cliente e verificar se alguma é mais recente que a última visualização
      const mensagensCliente = item.mensagens.filter((m: any) => m.role === "CLIENTE");
      const dataReferencia = item.ultimaVisualizacaoAdmin 
        ? new Date(item.ultimaVisualizacaoAdmin)
        : new Date(0); // Se nunca visualizou, qualquer mensagem é nova
      
      // Verificar se há alguma mensagem do cliente mais recente que a última visualização
      const temNovaMensagemCliente = mensagensCliente.some((msg: any) => 
        new Date(msg.createdAt) > dataReferencia
      );

      return {
        ...item,
        clienteNome: item.cliente.name || item.cliente.email,
        createdAtFormatted: new Date(item.createdAt).toLocaleDateString("pt-BR"),
        statusFormatted: item.status,
        temNovaMensagem: temNovaMensagemCliente,
      };
    });

    function getStatusColor(status: string) {
      const colors: Record<string, string> = {
        Solicitado: "bg-yellow-100 text-yellow-800",
        Aprovado: "bg-blue-100 text-blue-800",
        "Aguardando Pagamento": "bg-orange-100 text-orange-800",
        "Pagamento Aprovado": "bg-green-100 text-green-800",
        "Em Produção": "bg-purple-100 text-purple-800",
        "Em Expedição": "bg-indigo-100 text-indigo-800",
        "Em Transporte": "bg-cyan-100 text-cyan-800",
        Entregue: "bg-emerald-100 text-emerald-800",
        Reprovado: "bg-red-100 text-red-800",
        Expedido: "bg-indigo-100 text-indigo-800", // Compatibilidade com status antigo
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
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-base">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-left">
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Código</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Cliente</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-32">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700">Data</th>
                <th className="px-4 py-3 text-sm font-semibold text-gray-700 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rowsWithFormatted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-base text-gray-500">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              )}
              {rowsWithFormatted.map((row) => (
                <tr
                  key={row.id}
                  className="bg-white transition-colors hover:bg-blue-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <Link href={`/admin/pedidos/${row.id}`} className="flex items-center gap-2 hover:text-blue-600">
                      {row.temNovaMensagem && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                        </span>
                      )}
                      <span className="font-medium">{row.codigo}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <Link href={`/admin/pedidos/${row.id}`} className="hover:text-blue-600">
                      {row.clienteNome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Link href={`/admin/pedidos/${row.id}`} className="hover:opacity-80">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(row.statusFormatted)}`}>
                        {row.statusFormatted}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <Link href={`/admin/pedidos/${row.id}`} className="hover:text-blue-600">
                      {row.createdAtFormatted}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {row.temNovaMensagem && (
                      <Link href={`/admin/pedidos/${row.id}`} className="flex items-center justify-center">
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          Nova
                        </span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-base font-medium text-gray-700">Total: <span className="font-semibold text-gray-900">{total}</span></div>
      </div>
    );
  } catch (error: any) {
    return <DbError />;
  }
}
