import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const categoriaId = searchParams.get("categoriaId");
    const familiaId = searchParams.get("familiaId");
    const tipo = searchParams.get("tipo");
    const abertura = searchParams.get("abertura");
    const acionamento = searchParams.get("acionamento");

    // Construir filtros
    const where: any = {
      status: true,
    };

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    if (familiaId) {
      where.familiaId = familiaId;
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (abertura) {
      where.abertura = abertura;
    }

    if (acionamento) {
      where.acionamento = acionamento;
    }

    const produtos = await prisma.produto.findMany({
      where,
      include: {
        familia: { select: { nome: true } },
        categoria: { select: { nome: true } },
      },
      orderBy: { nome: "asc" },
    });

    return ok({ items: produtos, total: produtos.length });
  } catch (error: any) {
    console.error("Erro ao filtrar produtos:", error);
    return serverError(error?.message || "Erro ao filtrar produtos");
  }
}

