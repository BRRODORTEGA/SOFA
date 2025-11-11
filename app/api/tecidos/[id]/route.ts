import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";
import { tecidoSchema } from "@/lib/validators";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const item = await prisma.tecido.findUnique({ where: { id: params.id } });
  return item ? ok(item) : notFound();
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    console.log("PUT /api/tecidos/[id] - Recebido:", json); // Debug
    
    const parsed = tecidoSchema.safeParse(json);
    if (!parsed.success) {
      console.log("Erro de validação:", parsed.error.flatten()); // Debug
      return unprocessable(parsed.error.flatten());
    }
    
    console.log("Dados validados:", parsed.data); // Debug
    
    const updated = await prisma.tecido.update({ 
      where: { id: params.id }, 
      data: parsed.data 
    });
    
    console.log("Tecido atualizado:", updated); // Debug
    return ok(updated);
  } catch (e: any) {
    console.error("Erro ao atualizar tecido:", e); // Debug
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro interno do servidor");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se o tecido existe
    const tecido = await prisma.tecido.findUnique({
      where: { id: params.id },
      include: {
        produtos: { take: 1 },
        pedidoItems: { take: 1 },
        carrinhoItems: { take: 1 },
      },
    });

    if (!tecido) {
      return notFound("Tecido não encontrado");
    }

    // Verificar se há relacionamentos que impedem a exclusão
    if (tecido.produtos.length > 0) {
      return Response.json({ 
        ok: false, 
        error: "Não é possível excluir este tecido pois ele está vinculado a produtos. Remova os vínculos primeiro." 
      }, { status: 422 });
    }

    if (tecido.pedidoItems.length > 0) {
      return Response.json({ 
        ok: false, 
        error: "Não é possível excluir este tecido pois ele está sendo usado em pedidos." 
      }, { status: 422 });
    }

    if (tecido.carrinhoItems.length > 0) {
      return Response.json({ 
        ok: false, 
        error: "Não é possível excluir este tecido pois ele está no carrinho de compras de algum cliente." 
      }, { status: 422 });
    }

    // Se não houver relacionamentos, pode excluir
    await prisma.tecido.delete({ where: { id: params.id } });
    console.log("Tecido excluído com sucesso:", params.id); // Debug
    return ok({ deleted: true });
  } catch (e: any) {
    console.error("Erro ao excluir tecido:", e); // Debug
    if (e?.code === "P2025") return notFound("Tecido não encontrado");
    
    // Erro de constraint de foreign key
    if (e?.code === "P2003") {
      return Response.json({ 
        ok: false, 
        error: "Não é possível excluir este tecido pois ele está sendo usado em outros registros." 
      }, { status: 422 });
    }
    
    return serverError(e?.message || "Erro interno do servidor");
  }
}




