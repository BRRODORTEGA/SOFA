import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CategoriaFiltros from "./CategoriaFiltros";

export default async function CategoriaPage({ params }: { params: { id: string } }) {
  const categoria = await prisma.categoria.findUnique({
    where: { id: params.id },
    include: {
      familias: { where: { ativo: true }, orderBy: { nome: "asc" } },
    },
  });

  if (!categoria || !categoria.ativo) {
    notFound();
  }

  // Buscar todos os produtos da categoria para popular os filtros
  const produtosIniciais = await prisma.produto.findMany({
    where: { categoriaId: params.id, status: true },
    include: {
      familia: { select: { nome: true } },
      categoria: { select: { nome: true } },
    },
    orderBy: { nome: "asc" },
  });

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
      familias={categoria.familias.map(f => ({ id: f.id, nome: f.nome }))}
      categorias={categorias}
      produtosIniciais={produtosIniciais}
    />
  );
}

