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
    const { categoriasDestaque, produtosDestaque, tabelaPrecoVigenteId, produtosAtivosTabelaVigente, ordemCategorias } = body;

    // Validar dados
    if (!Array.isArray(categoriasDestaque) || !Array.isArray(produtosDestaque)) {
      return NextResponse.json(
        { error: "Dados inválidos: categoriasDestaque e produtosDestaque devem ser arrays" },
        { status: 400 }
      );
    }

    // Validar produtosAtivosTabelaVigente se fornecido
    if (produtosAtivosTabelaVigente !== undefined && produtosAtivosTabelaVigente !== null && !Array.isArray(produtosAtivosTabelaVigente)) {
      return NextResponse.json(
        { error: "produtosAtivosTabelaVigente deve ser um array" },
        { status: 400 }
      );
    }

    // Garantir que produtosAtivosTabelaVigente seja um array válido
    const produtosAtivos = Array.isArray(produtosAtivosTabelaVigente) ? produtosAtivosTabelaVigente : [];

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
    // Nota: Se houver erro sobre campos desconhecidos, o Prisma Client precisa ser regenerado
    let siteConfig;
    
    try {
      siteConfig = await prisma.siteConfig.upsert({
        where: { id: "site-config" },
        update: {
          categoriasDestaque,
          produtosDestaque,
          tabelaPrecoVigenteId: tabelaPrecoVigenteId || null,
          produtosAtivosTabelaVigente: produtosAtivos,
          ordemCategorias: ordemCategorias || categoriasDestaque,
        } as any, // Type assertion temporária até regenerar Prisma Client
        create: {
          id: "site-config",
          categoriasDestaque,
          produtosDestaque,
          tabelaPrecoVigenteId: tabelaPrecoVigenteId || null,
          produtosAtivosTabelaVigente: produtosAtivos,
          ordemCategorias: ordemCategorias || categoriasDestaque,
        } as any, // Type assertion temporária até regenerar Prisma Client
        include: {
          tabelaPrecoVigente: true,
        },
      });
    } catch (prismaError: any) {
      // Se o erro for sobre campos desconhecidos, o Prisma Client precisa ser regenerado
      if (prismaError.message?.includes("Unknown argument") || prismaError.message?.includes("Unknown field")) {
        throw new Error(
          "ERRO: Prisma Client desatualizado. Por favor:\n1. Pare o servidor Next.js (Ctrl+C)\n2. Execute: npx prisma generate\n3. Reinicie o servidor: npm run dev"
        );
      }
      throw prismaError;
    }

    return NextResponse.json(siteConfig);
  } catch (error: any) {
    console.error("Erro ao salvar configurações:", error);
    return NextResponse.json(
      { 
        error: "Erro ao salvar configurações",
        details: error?.message || String(error)
      },
      { status: 500 }
    );
  }
}

