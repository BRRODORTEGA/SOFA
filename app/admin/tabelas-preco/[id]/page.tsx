import { prisma } from "@/lib/prisma";
import EditTabelaPreco from "./ui-edit";
import TabelaPrecoView from "./TabelaPrecoView";

export default async function Page({ params, searchParams }: { params: { id: string }; searchParams: { tab?: string } }) {
  const item = await prisma.tabelaPreco.findUnique({ where: { id: params.id } });
  if (!item) return <div className="text-red-600">Tabela de preços não encontrada.</div>;
  
  // Se tab=precos, mostrar a visualização da tabela
  if (searchParams.tab === "precos") {
    return <TabelaPrecoView tabelaPrecoId={params.id} tabelaNome={item.nome} />;
  }
  
  // Caso contrário, mostrar o formulário de edição
  return <EditTabelaPreco item={item} />;
}

