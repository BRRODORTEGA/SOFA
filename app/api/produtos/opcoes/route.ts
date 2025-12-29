import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Buscar configurações do site para verificar produtos ativos da tabela vigente
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        tabelaPrecoVigenteId: true,
        produtosAtivosTabelaVigente: true,
      },
    });

    // Preparar filtro de produtos ativos
    const produtosAtivosFilter: any = { status: true };
    if (siteConfig?.tabelaPrecoVigenteId) {
      if (siteConfig.produtosAtivosTabelaVigente && siteConfig.produtosAtivosTabelaVigente.length > 0) {
        produtosAtivosFilter.id = { in: siteConfig.produtosAtivosTabelaVigente };
      } else {
        produtosAtivosFilter.id = { in: [] };
      }
    }

    // Buscar produtos ativos com suas variações e tecidos
    const produtos = await prisma.produto.findMany({
      where: produtosAtivosFilter,
      include: {
        variacoes: {
          select: {
            medida_cm: true,
          },
        },
        tecidos: {
          include: {
            tecido: {
              select: {
                id: true,
                nome: true,
                grade: true,
              },
            },
          },
        },
      },
    });

    // Extrair opções únicas
    const medidas = new Set<number>();
    const tecidos = new Map<string, { id: string; nome: string; grade: string }>();
    const tipos = new Set<string>();
    const aberturas = new Set<string>();
    const acionamentos = new Set<string>();

    produtos.forEach((produto) => {
      // Medidas das variações
      produto.variacoes.forEach((variacao) => {
        medidas.add(variacao.medida_cm);
      });

      // Tecidos
      produto.tecidos.forEach((pt) => {
        if (pt.tecido) {
          tecidos.set(pt.tecido.id, {
            id: pt.tecido.id,
            nome: pt.tecido.nome,
            grade: pt.tecido.grade,
          });
        }
      });

      // Tipo, Abertura, Acionamento
      if (produto.tipo) tipos.add(produto.tipo);
      if (produto.abertura) aberturas.add(produto.abertura);
      if (produto.acionamento) {
        produto.acionamento.split(",").forEach((a) => {
          const trimmed = a.trim();
          if (trimmed) acionamentos.add(trimmed);
        });
      }
    });

    return NextResponse.json({
      medidas: Array.from(medidas).sort((a, b) => a - b),
      tecidos: Array.from(tecidos.values()).sort((a, b) => a.nome.localeCompare(b.nome)),
      tipos: Array.from(tipos).sort(),
      aberturas: Array.from(aberturas).sort(),
      acionamentos: Array.from(acionamentos).sort(),
    });
  } catch (error) {
    console.error("Erro ao buscar opções de produto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar opções de produto" },
      { status: 500 }
    );
  }
}

