import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound, serverError } from "@/lib/http";
import { produtoTecidosSchema } from "@/lib/validators";

/** GET: lista Tecidos vinculados */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        tecidos: { include: { tecido: true } },
      },
    });
    if (!produto) return notFound("Produto não encontrado");
    const tecidoIds = produto.tecidos.map((pt) => pt.tecidoId);
    const full = produto.tecidos.map((pt) => pt.tecido);
    return ok({ tecidoIds, tecidos: full });
  } catch {
    return serverError();
  }
}

/** POST: substitui vínculos pelo conjunto informado (idempotente) */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const parsed = produtoTecidosSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());

    const produto = await prisma.produto.findUnique({ where: { id: params.id }, select: { id: true } });
    if (!produto) return notFound("Produto não encontrado");

    // Remove todos e recria (simples e idempotente)
    await prisma.produtoTecido.deleteMany({ where: { produtoId: produto.id } });
    if (parsed.data.tecidoIds.length) {
      await prisma.produtoTecido.createMany({
        data: parsed.data.tecidoIds.map((tid) => ({ produtoId: produto.id, tecidoId: tid })),
        skipDuplicates: true,
      });
    }

    return ok({ saved: true, count: parsed.data.tecidoIds.length });
  } catch {
    return serverError();
  }
}

/** DELETE: remove 1 vínculo específico (produto-tecido) */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const tecidoId = searchParams.get("tecidoId");
    if (!tecidoId) return unprocessable({ message: "tecidoId obrigatório na query string" });
    await prisma.produtoTecido.delete({ where: { produtoId_tecidoId: { produtoId: params.id, tecidoId } } });
    return ok({ removed: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound("Vínculo não encontrado");
    return serverError();
  }
}




