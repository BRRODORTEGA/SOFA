import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        filtrosAtivos: true,
        filtrosTitulo: true,
        filtrosAplicados: true,
        filtroCategoriaAtivo: true,
        filtroCategoriaNome: true,
        filtroCategoriaCategorias: true,
        filtroPrecoAtivo: true,
        filtroPrecoNome: true,
        filtroOpcoesProdutoAtivo: true,
        filtroOpcoesProdutoNome: true,
      },
    });

    // Retornar valores padrão se não existir configuração
    return NextResponse.json({
      filtrosAtivos: siteConfig?.filtrosAtivos ?? true,
      filtrosTitulo: siteConfig?.filtrosTitulo ?? true,
      filtrosAplicados: siteConfig?.filtrosAplicados ?? true,
      filtroCategoriaAtivo: siteConfig?.filtroCategoriaAtivo ?? true,
      filtroCategoriaNome: siteConfig?.filtroCategoriaNome || "Categoria",
      filtroCategoriaCategorias: siteConfig?.filtroCategoriaCategorias || [],
      filtroPrecoAtivo: siteConfig?.filtroPrecoAtivo ?? true,
      filtroPrecoNome: siteConfig?.filtroPrecoNome || "Preço",
      filtroOpcoesProdutoAtivo: siteConfig?.filtroOpcoesProdutoAtivo ?? true,
      filtroOpcoesProdutoNome: siteConfig?.filtroOpcoesProdutoNome || "Opções de Produto",
    });
  } catch (error) {
    console.error("Erro ao buscar configurações de filtros:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações de filtros" },
      { status: 500 }
    );
  }
}

