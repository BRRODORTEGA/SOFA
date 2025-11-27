import { AdminToolbar } from "@/components/admin/toolbar";
import { prisma } from "@/lib/prisma";
import DbError from "@/components/admin/db-error";
import ProdutosTable from "./ProdutosTable";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { q?: string; limit?: string; offset?: string; sortBy?: string; sortOrder?: string } }) {
  const limit = Number(searchParams.limit ?? 20);
  const offset = Number(searchParams.offset ?? 0);
  const q = searchParams.q?.trim() ?? "";
  const sortBy = searchParams.sortBy || "createdAt";
  const sortOrder = searchParams.sortOrder === "asc" ? "asc" : "desc";

  try {
    const where = q ? { nome: { contains: q, mode: "insensitive" } } : {};
    
    // Buscar todos os itens (sem paginação inicial) para ordenação correta
    const allItems = await prisma.produto.findMany({ 
      where, 
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
    });

    // Processar dados no servidor antes de ordenar
    const rowsWithFormatted = allItems.map(item => ({
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

    // Ordenar os dados processados
    const sortedRows = [...rowsWithFormatted].sort((a, b) => {
      let aValue: any = (a as any)[sortBy];
      let bValue: any = (b as any)[sortBy];
      
      // Tratar valores nulos/undefined
      if (aValue === null || aValue === undefined || aValue === "-") aValue = "";
      if (bValue === null || bValue === undefined || bValue === "-") bValue = "";
      
      // Comparação numérica para contagens
      if (sortBy === "variacoesCount" || sortBy === "precosCount") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      }
      
      // Comparação de strings
      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // Aplicar paginação após ordenação
    const items = sortedRows.slice(offset, offset + limit);
    const total = sortedRows.length;

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
          rows={items}
          basePath="/admin/produtos"
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
        <div className="mt-4 text-base font-medium text-gray-700">Total: <span className="font-semibold text-gray-900">{total}</span></div>
      </div>
    );
  } catch (error: any) {
    return <DbError />;
  }
}
