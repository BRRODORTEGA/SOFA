import { prisma } from "@/lib/prisma";
import EditTecido from "./ui-edit";

export default async function Page({ params }: { params: { id: string } }) {
  const item = await prisma.tecido.findUnique({ where: { id: params.id } });
  if (!item) return <div className="text-red-600">Tecido não encontrado.</div>;
  return <EditTecido item={item} />;
}

