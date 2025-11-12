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
    console.log("PUT /api/familias/[id] - Recebido:", json);
    
    const parsed = familiaSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Erro de validação:", parsed.error.flatten());
      return unprocessable(parsed.error.flatten());
    }
    
    // Preparar dados - categoriaId pode ser null/undefined
    const data: any = {
      nome: parsed.data.nome,
      descricao: parsed.data.descricao || null,
      ativo: parsed.data.ativo ?? true,
      perfilMedidas: parsed.data.perfilMedidas || null,
    };
    
    // Adicionar categoriaId apenas se fornecido, senão definir como null
    if (parsed.data.categoriaId) {
      data.categoriaId = parsed.data.categoriaId;
    } else {
      data.categoriaId = null;
    }
    
    console.log("Atualizando família com dados:", data);
    const updated = await prisma.familia.update({ 
      where: { id: params.id }, 
      data 
    });
    
    console.log("Família atualizada:", updated);
    return ok(updated);
  } catch (e: any) {
    console.error("Erro ao atualizar família:", e);
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro interno do servidor");
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se há produtos vinculados antes de tentar excluir
    const familia = await prisma.familia.findUnique({
      where: { id: params.id },
      include: {
        produtos: { take: 1 },
      },
    });

    if (!familia) {
      return notFound();
    }

    if (familia.produtos.length > 0) {
      return Response.json({ 
        ok: false, 
        error: "Não é possível excluir esta família pois existem produtos vinculados a ela. Remova os produtos primeiro." 
      }, { status: 422 });
    }

    await prisma.familia.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (e: any) {
    console.error("Erro ao excluir família:", e);
    if (e?.code === "P2025") return notFound();
    
    // Verificar se há produtos vinculados (código P2003 ou mensagem de foreign key)
    if (e?.code === "P2003" || 
        e?.message?.includes("foreign key") || 
        e?.message?.includes("violates") ||
        e?.message?.includes("referenced from table")) {
      return Response.json({ 
        ok: false, 
        error: "Não é possível excluir esta família pois existem produtos vinculados a ela. Remova os produtos primeiro." 
      }, { status: 422 });
    }
    
    return serverError(e?.message || "Erro ao excluir família");
  }
}




