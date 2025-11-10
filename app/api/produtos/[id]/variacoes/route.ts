import { prisma } from "@/lib/prisma";
import { ok, created, unprocessable, notFound, serverError } from "@/lib/http";
import { variacaoSchema } from "@/lib/validators";

/** GET: lista variações do produto */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const variacoes = await prisma.variacao.findMany({
      where: { produtoId: params.id },
      orderBy: { medida_cm: "asc" },
    });
    return ok({ items: variacoes });
  } catch {
    return serverError();
  }
}

/** POST: cria uma variação (chave única: produtoId+medida_cm) */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const parsed = variacaoSchema.safeParse(json);
    if (!parsed.success) return unprocessable(parsed.error.flatten());

    const data = parsed.data;
    const createdItem = await prisma.variacao.create({
      data: { ...data, produtoId: params.id },
    });
    return created(createdItem);
  } catch (e: any) {
    // P2002: unique violada -> já existe essa medida
    if (e?.code === "P2002") {
      return unprocessable({ message: "Já existe variação com esta medida para o produto." });
    }
    return serverError();
  }
}

/** PUT (em massa): atualiza várias variações por id (opcional) */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    console.log("PUT /api/produtos/[id]/variacoes - Recebido:", json); // Debug
    
    if (!Array.isArray(json)) {
      console.log("Erro: Payload não é uma lista"); // Debug
      return unprocessable({ message: "Payload deve ser uma lista" });
    }

    // valida cada item
    for (const item of json) {
      const parsed = variacaoSchema.safeParse(item);
      if (!parsed.success) {
        console.log("Erro de validação:", parsed.error.flatten()); // Debug
        return unprocessable(parsed.error.flatten());
      }
    }

    const results = [];
    for (const item of json) {
      const { medida_cm, ...rest } = item;
      console.log(`Atualizando variação medida ${medida_cm} com dados:`, rest); // Debug
      
      const updated = await prisma.variacao.update({
        where: { produtoId_medida_cm: { produtoId: params.id, medida_cm } },
        data: rest,
      });
      results.push(updated);
    }
    
    console.log(`Variações atualizadas: ${results.length}`); // Debug
    return ok({ updated: results.length });
  } catch (e: any) {
    console.error("Erro ao atualizar variações:", e); // Debug
    if (e?.code === "P2025") return notFound("Uma ou mais variações não existem");
    return serverError(e?.message || "Erro interno do servidor");
  }
}

/** DELETE: remove uma variação pela medida (query ?medida=110) */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const medida = Number(new URL(req.url).searchParams.get("medida"));
    if (!medida) return unprocessable({ message: "medida (cm) obrigatória" });
    await prisma.variacao.delete({ where: { produtoId_medida_cm: { produtoId: params.id, medida_cm: medida } } });
    return ok({ removed: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound("Variação não encontrada");
    return serverError();
  }
}




