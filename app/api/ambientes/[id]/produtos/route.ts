import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";

/** Lista os produtos vinculados a este ambiente */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const ambiente = await prisma.ambiente.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nome: true,
        produtos: { select: { id: true, nome: true, familia: { select: { nome: true } } } },
      },
    });
    if (!ambiente) return notFound();
    return ok({ ambiente: { id: ambiente.id, nome: ambiente.nome }, items: ambiente.produtos });
  } catch (e) {
    return serverError();
  }
}

/** Vincula um produto ao ambiente */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const produtoId = typeof json?.produtoId === "string" ? json.produtoId.trim() : null;
    if (!produtoId) return unprocessable({ message: "produtoId é obrigatório" });

    const ambiente = await prisma.ambiente.findUnique({ where: { id: params.id } });
    if (!ambiente) return notFound();

    await prisma.ambiente.update({
      where: { id: params.id },
      data: { produtos: { connect: { id: produtoId } } },
    });
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      select: { id: true, nome: true, familia: { select: { nome: true } } },
    });
    return ok(produto);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro ao vincular produto");
  }
}

/** Remove o vínculo de um produto com o ambiente */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const produtoId = url.searchParams.get("produtoId");
    if (!produtoId) return unprocessable({ message: "produtoId é obrigatório" });

    const ambiente = await prisma.ambiente.findUnique({ where: { id: params.id } });
    if (!ambiente) return notFound();

    await prisma.ambiente.update({
      where: { id: params.id },
      data: { produtos: { disconnect: { id: produtoId } } },
    });
    return ok({ removed: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError();
  }
}
