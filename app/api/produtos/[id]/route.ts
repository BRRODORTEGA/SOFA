import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";
import { produtoSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.produto.findUnique({
    where: { id: params.id },
    include: {
      familia: { select: { nome: true } },
      categoria: { select: { nome: true } },
      tecidos: {
        include: {
          tecido: { select: { id: true, nome: true, grade: true, imagemUrl: true } },
        },
      },
      variacoes: {
        select: {
          medida_cm: true,
          largura_cm: true,
          profundidade_cm: true,
          altura_cm: true,
        },
        orderBy: { medida_cm: "asc" },
      },
    },
  });

  if (!item) return notFound();

  // Transformar tecidos para formato mais simples
  const produto = {
    ...item,
    tecidos: item.tecidos.map((pt) => pt.tecido),
  };

  return ok(produto);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    console.log("PUT /api/produtos/[id] - Recebido:", json); // Debug
    
    const parsed = produtoSchema.safeParse(json);
    if (!parsed.success) {
      console.log("Erro de validação:", parsed.error.flatten()); // Debug
      return unprocessable(parsed.error.flatten());
    }
    
    console.log("Dados validados:", parsed.data); // Debug
    
    const updated = await prisma.produto.update({ 
      where: { id: params.id }, 
      data: parsed.data 
    });
    
    console.log("Produto atualizado:", updated); // Debug
    return ok(updated);
  } catch (e: any) {
    console.error("Erro ao atualizar produto:", e); // Debug
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro interno do servidor");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.produto.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError();
  }
}




