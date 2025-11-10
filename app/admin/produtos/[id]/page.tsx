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
  const item = await prisma.produto.findUnique({ where: { id: params.id } });
  if (!item) return <div className="text-red-600">Produto não encontrado.</div>;
  return <ProdutoDetailTabs produto={item} activeTab={resolvedSearchParams.tab || "dados"} />;
}

