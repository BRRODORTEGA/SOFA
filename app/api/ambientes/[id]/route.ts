import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";
import { ambienteSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.ambiente.findUnique({ where: { id: params.id } });
  return item ? ok(item) : notFound();
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const parsed = ambienteSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());
    const updated = await prisma.ambiente.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return ok(updated);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro interno do servidor");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.ambiente.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError();
  }
}
