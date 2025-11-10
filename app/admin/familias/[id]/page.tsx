import { prisma } from "@/lib/prisma";
import EditFamilia from "./ui-edit";

export default async function Page({ params }: { params: { id: string } }) {
  const item = await prisma.familia.findUnique({ where: { id: params.id } });
  if (!item) return <div className="text-red-600">Família não encontrada.</div>;
  return <EditFamilia item={item} />;
}

