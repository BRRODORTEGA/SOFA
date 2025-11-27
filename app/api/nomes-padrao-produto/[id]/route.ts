import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";
import { z } from "zod";

const nomePadraoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  ativo: z.boolean().default(true),
  ordem: z.number().int().optional().nullable(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.nomePadraoProduto.findUnique({
      where: { id: params.id },
    });
    
    if (!item) return notFound();
    
    return ok(item);
  } catch (error: any) {
    console.error("Erro ao buscar nome padrão:", error);
    return serverError(error?.message || "Erro ao buscar nome padrão");
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const parsed = nomePadraoSchema.safeParse(json);
    
    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
    }
    
    const updated = await prisma.nomePadraoProduto.update({
      where: { id: params.id },
      data: parsed.data,
    });
    
    return ok(updated);
  } catch (e: any) {
    console.error("Erro ao atualizar nome padrão:", e);
    
    if (e?.code === "P2025") return notFound();
    
    // Erro de duplicata
    if (e?.code === "P2002") {
      return unprocessable({
        message: "Já existe um nome padrão com este nome.",
      });
    }
    
    return serverError(e?.message || "Erro ao atualizar nome padrão");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.nomePadraoProduto.delete({
      where: { id: params.id },
    });
    
    return ok({ deleted: true });
  } catch (e: any) {
    console.error("Erro ao excluir nome padrão:", e);
    
    if (e?.code === "P2025") return notFound();
    
    return serverError(e?.message || "Erro ao excluir nome padrão");
  }
}

