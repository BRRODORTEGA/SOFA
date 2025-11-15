import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["ADMIN", "OPERADOR"].includes(role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      include: {
        tabelaPrecoVigente: true,
      },
    });

    if (!siteConfig) {
      // Criar configuração padrão se não existir
      const newConfig = await prisma.siteConfig.create({
        data: {
          id: "site-config",
          categoriasDestaque: [],
          produtosDestaque: [],
          ordemCategorias: [],
        },
        include: {
          tabelaPrecoVigente: true,
        },
      });
      return NextResponse.json(newConfig);
    }

    return NextResponse.json(siteConfig);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || !["ADMIN", "OPERADOR"].includes(role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { categoriasDestaque, produtosDestaque, tabelaPrecoVigenteId, ordemCategorias } = body;

    // Validar dados
    if (!Array.isArray(categoriasDestaque) || !Array.isArray(produtosDestaque)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    // Verificar se a tabela de preço existe (se fornecida)
    if (tabelaPrecoVigenteId) {
      const tabelaPreco = await prisma.tabelaPreco.findUnique({
        where: { id: tabelaPrecoVigenteId },
      });
      if (!tabelaPreco) {
        return NextResponse.json(
          { error: "Tabela de preço não encontrada" },
          { status: 404 }
        );
      }
    }

    // Atualizar ou criar configuração
    const siteConfig = await prisma.siteConfig.upsert({
      where: { id: "site-config" },
      update: {
        categoriasDestaque,
        produtosDestaque,
        tabelaPrecoVigenteId: tabelaPrecoVigenteId || null,
        ordemCategorias: ordemCategorias || categoriasDestaque,
      },
      create: {
        id: "site-config",
        categoriasDestaque,
        produtosDestaque,
        tabelaPrecoVigenteId: tabelaPrecoVigenteId || null,
        ordemCategorias: ordemCategorias || categoriasDestaque,
      },
      include: {
        tabelaPrecoVigente: true,
      },
    });

    return NextResponse.json(siteConfig);
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configurações" },
      { status: 500 }
    );
  }
}

