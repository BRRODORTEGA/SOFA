import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";

/** Lista os ambientes vinculados a este produto */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nome: true,
        ambientes: { select: { id: true, nome: true } },
      },
    });
    if (!produto) return notFound();
    return ok({ produto: { id: produto.id, nome: produto.nome }, items: produto.ambientes });
  } catch (e) {
    return serverError();
  }
}

/** Define em quais ambientes este produto se encaixa (substitui a lista atual) */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const ambienteIds = Array.isArray(json?.ambienteIds)
      ? (json.ambienteIds as string[]).filter((id: unknown) => typeof id === "string" && id.trim() !== "")
      : [];

    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!produto) return notFound();

    await prisma.produto.update({
      where: { id: params.id },
      data: {
        ambientes: {
          set: ambienteIds.map((id) => ({ id })),
        },
      },
    });

    const updated = await prisma.produto.findUnique({
      where: { id: params.id },
      select: { ambientes: { select: { id: true, nome: true } } },
    });
    return ok(updated?.ambientes ?? []);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro ao atualizar ambientes do produto");
  }
}
