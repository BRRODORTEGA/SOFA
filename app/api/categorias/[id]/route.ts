import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";
import { categoriaSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.categoria.findUnique({ where: { id: params.id } });
  return item ? ok(item) : notFound();
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const parsed = categoriaSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());
    const updated = await prisma.categoria.update({ where: { id: params.id }, data: parsed.data });
    return ok(updated);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError();
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.categoria.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError();
  }
}




