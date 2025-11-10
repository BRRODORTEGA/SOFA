import { prisma } from "@/lib/prisma";
import EditCategoria from "./ui-edit";

export default async function Page({ params }: { params: { id: string } }) {
  const item = await prisma.categoria.findUnique({ where: { id: params.id } });
  if (!item) return <div className="text-red-600">Categoria não encontrada.</div>;
  return <EditCategoria item={item} />;
}

