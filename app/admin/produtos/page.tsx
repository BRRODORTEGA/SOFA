import { AdminToolbar } from "@/components/admin/toolbar";
import { prisma } from "@/lib/prisma";
import DbError from "@/components/admin/db-error";
import ProdutosTable from "./ProdutosTable";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { q?: string; limit?: string; offset?: string } }) {
  const limit = Number(searchParams.limit ?? 20);
  const offset = Number(searchParams.offset ?? 0);
  const q = searchParams.q?.trim() ?? "";

  try {
    const where = q ? { nome: { contains: q, mode: "insensitive" } } : {};
    const [items, total] = await Promise.all([
      prisma.produto.findMany({ 
        where, 
        take: limit, 
        skip: offset, 
        orderBy: { createdAt: "desc" }, 
        include: { 
          categoria: { select: { nome: true } }, 
          familia: { select: { nome: true } },
          _count: {
            select: {
              variacoes: true,
              precos: true,
            },
          },
        } 
      }),
      prisma.produto.count({ where }),
    ]);

    // Processar dados no servidor antes de passar para o Client Component
    const rowsWithFormatted = items.map(item => ({
      ...item,
      categoriaNome: item.categoria?.nome || "-",
      familiaNome: item.familia?.nome || "-",
      tipoFormatted: item.tipo || "-",
      aberturaFormatted: item.abertura || "-",
      acionamentoFormatted: item.acionamento 
        ? item.acionamento.split(",").map(a => a.trim()).join(", ")
        : "-",
      variacoesCount: item._count.variacoes ?? 0,
      precosCount: item._count.precos ?? 0,
      statusFormatted: item.status ? "Ativo" : "Inativo"
    }));

    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Produtos</h1>
        <AdminToolbar createHref="/admin/produtos/new" />
        <ProdutosTable
          columns={[
            { key: "categoriaNome", header: "Categoria" },
            { key: "familiaNome", header: "Família" },
            { key: "nome", header: "Nome" },
            { key: "tipoFormatted", header: "Tipo" },
            { key: "aberturaFormatted", header: "Abertura" },
            { key: "acionamentoFormatted", header: "Acionamento" },
            { key: "variacoesCount", header: "Variações" },
            { key: "precosCount", header: "Preços" },
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
