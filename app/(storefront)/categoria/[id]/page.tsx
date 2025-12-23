import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CategoriaFiltros from "./CategoriaFiltros";

export default async function CategoriaPage({ params }: { params: { id: string } }) {
  const categoria = await prisma.categoria.findUnique({
    where: { id: params.id },
  });

  if (!categoria || !categoria.ativo) {
    notFound();
  }

  // Buscar configurações do site para verificar produtos ativos da tabela vigente
  const siteConfig = await prisma.siteConfig.findUnique({
    where: { id: "site-config" },
    select: {
      tabelaPrecoVigenteId: true,
      produtosAtivosTabelaVigente: true,
    },
  });

  // Preparar filtro de produtos ativos
  const whereFilter: any = { categoriaId: params.id, status: true };
  if (siteConfig?.tabelaPrecoVigenteId) {
    if (siteConfig.produtosAtivosTabelaVigente && siteConfig.produtosAtivosTabelaVigente.length > 0) {
      whereFilter.id = { in: siteConfig.produtosAtivosTabelaVigente };
    } else {
      // Se houver tabela vigente mas nenhum produto ativo, não mostrar nenhum produto
      whereFilter.id = { in: [] };
    }
  }

  // Buscar produtos da categoria que estão ativos na tabela vigente
  const produtosIniciais = await prisma.produto.findMany({
    where: whereFilter,
    include: {
      familia: { select: { id: true, nome: true } },
      categoria: { select: { nome: true } },
    },
    orderBy: { nome: "asc" },
  });

  // Extrair famílias únicas dos produtos da categoria
  const familiasMap = new Map<string, { id: string; nome: string }>();
  produtosIniciais.forEach(produto => {
    if (produto.familia) {
      familiasMap.set(produto.familia.id, {
        id: produto.familia.id,
        nome: produto.familia.nome,
      });
    }
  });
  const familias = Array.from(familiasMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));

  // Buscar todas as categorias para o seletor
  const categorias = await prisma.categoria.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
    orderBy: { nome: "asc" },
  });

  return (
    <CategoriaFiltros
      categoriaId={categoria.id}
      categoriaNome={categoria.nome}
      familias={familias}
      categorias={categorias}
      produtosIniciais={produtosIniciais}
    />
  );
}

