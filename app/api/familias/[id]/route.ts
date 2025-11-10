import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";
import { familiaSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.familia.findUnique({ where: { id: params.id } });
  return item ? ok(item) : notFound();
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    console.log("PUT /api/familias/[id] - Recebido:", json); // Debug
    
    const parsed = familiaSchema.safeParse(json);
    if (!parsed.success) {
      console.log("Erro de validação:", parsed.error.flatten()); // Debug
      return unprocessable(parsed.error.flatten());
    }
    
    console.log("Dados validados:", parsed.data); // Debug
    
    const updated = await prisma.familia.update({ 
      where: { id: params.id }, 
      data: parsed.data 
    });
    
    console.log("Família atualizada:", updated); // Debug
    return ok(updated);
  } catch (e: any) {
    console.error("Erro ao atualizar família:", e); // Debug
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro interno do servidor");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.familia.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError();
  }
}




