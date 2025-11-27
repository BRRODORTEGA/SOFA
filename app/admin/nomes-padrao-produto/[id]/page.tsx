import { prisma } from "@/lib/prisma";
import EditNomePadrao from "./ui-edit";

export default async function Page({ params }: { params: { id: string } }) {
  const item = await prisma.nomePadraoProduto.findUnique({ where: { id: params.id } });
  if (!item) return <div className="text-red-600">Nome padrão não encontrado.</div>;
  return <EditNomePadrao item={item} />;
}

