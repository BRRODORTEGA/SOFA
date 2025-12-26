import { prisma } from "@/lib/prisma";
import DbError from "@/components/admin/db-error";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClienteRepresentanteToggle } from "./ClienteRepresentanteToggle";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: { id: string } }) {
  try {
    const cliente = await prisma.user.findUnique({
      where: { 
        id: params.id,
        role: "CLIENTE", // Garantir que é um cliente
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerificado: true,
        representante: true,
        createdAt: true,
        updatedAt: true,
        pedidos: {
          orderBy: { createdAt: "desc" },
          include: {
            itens: {
              include: {
                produto: { select: { nome: true } },
                tecido: { select: { nome: true, grade: true } },
              },
            },
          },
        },
        _count: {
          select: {
            pedidos: true,
          },
        },
      },
    });

    if (!cliente) {
      return notFound();
    }

    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Detalhes do Cliente</h1>
          <Link
            href="/admin/clientes"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            ← Voltar
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Informações do Cliente */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Informações Pessoais</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nome</dt>
                <dd className="mt-1 text-base text-gray-900">{cliente.name || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                <dd className="mt-1 text-base text-gray-900">{cliente.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">E-mail Verificado</dt>
                <dd className="mt-1">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    cliente.emailVerificado 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {cliente.emailVerificado ? "Sim" : "Não"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-2">Tipo de Cliente</dt>
                <dd className="mt-1">
                  <ClienteRepresentanteToggle 
                    clienteId={cliente.id} 
                    representante={cliente.representante || false}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Data de Cadastro</dt>
                <dd className="mt-1 text-base text-gray-900">
                  {new Date(cliente.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total de Pedidos</dt>
                <dd className="mt-1 text-base font-semibold text-gray-900">{cliente._count.pedidos}</dd>
              </div>
            </dl>
          </div>

          {/* Estatísticas */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Estatísticas</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total de Pedidos</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">{cliente._count.pedidos}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Última Atualização</dt>
                <dd className="mt-1 text-base text-gray-900">
                  {new Date(cliente.updatedAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Histórico de Pedidos */}
        {cliente.pedidos.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">Histórico de Pedidos</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Itens
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {cliente.pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                        {pedido.codigo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          pedido.status === "Solicitado" ? "bg-yellow-100 text-yellow-800" :
                          pedido.status === "Aprovado" ? "bg-blue-100 text-blue-800" :
                          pedido.status === "Aguardando Pagamento" ? "bg-orange-100 text-orange-800" :
                          pedido.status === "Pagamento Aprovado" ? "bg-green-100 text-green-800" :
                          pedido.status === "Em Produção" ? "bg-purple-100 text-purple-800" :
                          pedido.status === "Em Expedição" ? "bg-indigo-100 text-indigo-800" :
                          pedido.status === "Em Transporte" ? "bg-cyan-100 text-cyan-800" :
                          pedido.status === "Entregue" ? "bg-emerald-100 text-emerald-800" :
                          pedido.status === "Expedido" ? "bg-indigo-100 text-indigo-800" : // Compatibilidade
                          pedido.status === "Reprovado" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {pedido.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {pedido.itens.length} item(s)
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900">
                        {new Date(pedido.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm">
                        <Link
                          href={`/admin/pedidos/${pedido.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {cliente.pedidos.length === 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-center text-gray-500">Este cliente ainda não realizou nenhum pedido.</p>
          </div>
        )}
      </div>
    );
  } catch (error: any) {
    console.error("Erro ao carregar cliente:", error);
    return <DbError />;
  }
}

