import { prisma } from "@/lib/prisma";
import { ok, notFound, serverError } from "@/lib/http";
import { requireAdminSession } from "@/lib/auth-guard";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminSession();

    const { status } = await req.json();

    if (typeof status !== "boolean") {
      return Response.json(
        { error: "Status deve ser um valor booleano" },
        { status: 400 }
      );
    }

    const produto = await prisma.produto.findUnique({
      where: { id: params.id },
    });

    if (!produto) {
      return notFound();
    }

    const updated = await prisma.produto.update({
      where: { id: params.id },
      data: { status },
    });

    return ok(updated);
  } catch (e: any) {
    console.error("Erro ao atualizar status do produto:", e);
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro ao atualizar status");
  }
}

