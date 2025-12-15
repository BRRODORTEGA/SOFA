import { prisma } from "@/lib/prisma";
import ProdutoDetailTabs from "./ProdutoDetailTabs";

export const dynamic = "force-dynamic";

export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: { id: string };
  searchParams: Promise<{ tab?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const item = await prisma.produto.findUnique({ 
    where: { id: params.id },
  });
  
  if (!item) return <div className="text-red-600">Produto não encontrado.</div>;
  
  // Carregar imagens detalhadas separadamente (para evitar erro de cliente Prisma não atualizado)
  let imagensDetalhadas: any[] = [];
  try {
    imagensDetalhadas = await prisma.produtoImagem.findMany({
      where: { produtoId: params.id },
      select: {
        id: true,
        url: true,
        tecidoId: true,
        tipo: true,
        ordem: true,
      },
      orderBy: [{ tipo: "asc" }, { ordem: "asc" }],
    });
  } catch (e) {
    // Se a tabela ainda não existir, usar array vazio
    console.log("Tabela ProdutoImagem ainda não existe ou cliente Prisma não atualizado");
  }
  
  const produtoComImagens = {
    ...item,
    imagensDetalhadas,
  };
  
  return <ProdutoDetailTabs produto={produtoComImagens} activeTab={resolvedSearchParams.tab || "dados"} />;
}

