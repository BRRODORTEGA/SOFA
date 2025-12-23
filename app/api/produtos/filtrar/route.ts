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

    // Buscar configurações do site para verificar produtos ativos da tabela vigente
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        tabelaPrecoVigenteId: true,
        produtosAtivosTabelaVigente: true,
      },
    });

    // Construir filtros
    const where: any = {
      status: true,
    };

    // Filtrar por produtos ativos da tabela vigente se configurado
    if (siteConfig?.tabelaPrecoVigenteId) {
      if (siteConfig.produtosAtivosTabelaVigente && siteConfig.produtosAtivosTabelaVigente.length > 0) {
        where.id = { in: siteConfig.produtosAtivosTabelaVigente };
      } else {
        // Se houver tabela vigente mas nenhum produto ativo, não retornar nenhum produto
        where.id = { in: [] };
      }
    }

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
        familia: { select: { id: true, nome: true } },
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

