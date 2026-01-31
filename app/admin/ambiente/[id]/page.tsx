import { prisma } from "@/lib/prisma";
import EditAmbiente from "./ui-edit";

export default async function Page({ params }: { params: { id: string } }) {
  const item = await prisma.ambiente.findUnique({ where: { id: params.id } });
  if (!item) return <div className="text-red-600">Ambiente não encontrado.</div>;
  return <EditAmbiente item={item} />;
}
