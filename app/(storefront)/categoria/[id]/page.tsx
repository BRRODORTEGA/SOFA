import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function CategoriaPage({ params }: { params: { id: string } }) {
  const categoria = await prisma.categoria.findUnique({
    where: { id: params.id },
    include: {
      familias: { where: { ativo: true } },
    },
  });

  if (!categoria || !categoria.ativo) {
    notFound();
  }

  const produtos = await prisma.produto.findMany({
    where: { categoriaId: params.id, status: true },
    include: {
      familia: { select: { nome: true } },
      categoria: { select: { nome: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{categoria.nome}</h1>
        <p className="mt-2 text-gray-600">
          {produtos.length} {produtos.length === 1 ? "produto encontrado" : "produtos encontrados"}
        </p>
      </div>

      {produtos.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-gray-600">Nenhum produto encontrado nesta categoria.</p>
          <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {produtos.map((produto) => (
            <Link
              key={produto.id}
              href={`/produto/${produto.id}`}
              className="group overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-lg"
            >
              {produto.imagens?.[0] ? (
                <div className="aspect-square relative overflow-hidden bg-gray-100">
                  <img
                    src={produto.imagens[0]}
                    alt={produto.nome}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Sem imagem</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {produto.nome}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{produto.familia?.nome}</p>
                {produto.tipo && <p className="mt-1 text-xs text-gray-500">{produto.tipo}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

