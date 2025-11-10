import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const categorias = await prisma.categoria.findMany({
    where: { ativo: true },
    include: {
      familias: { where: { ativo: true }, take: 3 },
      produtos: { where: { status: true }, take: 4 },
    },
    take: 6,
  });

  const produtosDestaque = await prisma.produto.findMany({
    where: { status: true },
    include: {
      familia: { select: { nome: true } },
      categoria: { select: { nome: true } },
    },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      {/* Banner Principal */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-100 py-16 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-4xl font-bold text-gray-900 md:text-5xl">
            Sofás sob medida com o conforto que você merece
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Escolha seu modelo, tecido e medida ideal. Personalize seu sofá do jeito que você sempre sonhou.
          </p>
          <Link
            href="/categorias"
            className="mt-6 inline-block rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            Ver Catálogo
          </Link>
        </div>
      </section>

      {/* Categorias */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-8 text-3xl font-bold text-gray-900">Categorias</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {categorias.map((cat) => (
            <Link
              key={cat.id}
              href={`/categoria/${cat.id}`}
              className="group relative overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-lg"
            >
              <div className="p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {cat.nome}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {cat.produtos.length} {cat.produtos.length === 1 ? "produto" : "produtos"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Produtos em Destaque */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-3xl font-bold text-gray-900">Produtos em Destaque</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {produtosDestaque.map((produto) => (
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
                  <p className="mt-1 text-xs text-gray-500">{produto.categoria?.nome}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
