import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound, serverError } from "@/lib/http";
import { requireAdminSession } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

/** PATCH — atualiza o status (ativo/inativo) de uma tabela de preços */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdminSession();

    const json = await req.json();
    const { ativo } = json;

    if (typeof ativo !== "boolean") {
      return unprocessable({ message: "O campo 'ativo' deve ser um booleano" });
    }

    const item = await prisma.tabelaPreco.update({
      where: { id: params.id },
      data: { ativo },
    });

    return ok({ item });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro ao atualizar status da tabela de preços");
  }
}

