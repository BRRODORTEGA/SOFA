import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function CategoriasPage() {
  const categorias = await prisma.categoria.findMany({
    where: { ativo: true },
    include: {
      produtos: { where: { status: true } },
    },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">Categorias</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categorias.map((categoria) => (
          <Link
            key={categoria.id}
            href={`/categoria/${categoria.id}`}
            className="group overflow-hidden rounded-lg border bg-white p-6 transition-shadow hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
              {categoria.nome}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {categoria.produtos.length} {categoria.produtos.length === 1 ? "produto" : "produtos"}
            </p>
          </Link>
        ))}
      </div>

      {categorias.length === 0 && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <p className="text-gray-600">Nenhuma categoria disponível no momento.</p>
        </div>
      )}
    </div>
  );
}

