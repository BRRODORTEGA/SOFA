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
    <div className="overflow-hidden">
      {/* Hero Section - Mais Impactante */}
      <section className="relative bg-gradient-to-br from-bg-2 via-bg-3 to-bg-4 py-20 md:py-32 lg:py-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-display font-light text-foreground mb-6 leading-[115%]">
              Sofás sob medida com o conforto que você merece
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light leading-[150%] max-w-2xl mx-auto mb-10">
              Escolha seu modelo, tecido e medida ideal. Personalize seu sofá do jeito que você sempre sonhou.
            </p>
            <Link
              href="/categorias"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-primary-foreground font-medium hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Ver Catálogo
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias - Design Refinado */}
      <section className="py-15 md:py-25 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-h1 font-light text-foreground mb-3">Nossas Categorias</h2>
            <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
              Descubra tudo que você precisa através das categorias!
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {categorias.map((cat) => (
              <Link
                key={cat.id}
                href={`/categoria/${cat.id}`}
                className="group relative overflow-hidden rounded-[15px] bg-white border border-border hover:border-gray-1 transition-all duration-500 hover:shadow-xl"
              >
                <div className="p-6 md:p-8 text-center min-h-[180px] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center mb-4 group-hover:bg-bg-3 transition-colors duration-300">
                    <svg className="w-8 h-8 text-gray-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <h3 className="text-base md:text-lg font-medium text-foreground group-hover:text-primary transition-colors duration-300 mb-2">
                    {cat.nome}
                  </h3>
                  <p className="text-sm text-muted-foreground font-light">
                    {cat.produtos.length} {cat.produtos.length === 1 ? "produto" : "produtos"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Produtos em Destaque - Design Elegante */}
      <section className="py-15 md:py-25 bg-bg-1">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-h1 font-light text-foreground mb-3">Produtos em Destaque</h2>
            <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
              Confira nossa seleção especial de sofás
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {produtosDestaque.map((produto) => (
              <Link
                key={produto.id}
                href={`/produto/${produto.id}`}
                className="group overflow-hidden rounded-[15px] bg-white border border-border hover:border-gray-1 transition-all duration-500 hover:shadow-2xl"
              >
                {produto.imagens?.[0] ? (
                  <div className="aspect-square relative overflow-hidden bg-bg-2">
                    <img
                      src={produto.imagens[0]}
                      alt={produto.nome}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ) : (
                  <div className="aspect-square bg-bg-2 flex items-center justify-center">
                    <span className="text-gray-2 text-sm">Sem imagem</span>
                  </div>
                )}
                <div className="p-5 md:p-6">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors duration-300 mb-2 text-lg">
                    {produto.nome}
                  </h3>
                  <p className="text-sm text-muted-foreground font-light mb-1">{produto.familia?.nome}</p>
                  <p className="text-xs text-gray-3 font-light">{produto.categoria?.nome}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Seção de Confiança */}
      <section className="py-12 md:py-16 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-medium text-foreground mb-2">Segurança</h3>
              <p className="text-sm text-muted-foreground font-light">Compra 100% segura e protegida</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-foreground mb-2">Melhor Preço</h3>
              <p className="text-sm text-muted-foreground font-light">Preços competitivos e transparentes</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-medium text-foreground mb-2">Qualidade</h3>
              <p className="text-sm text-muted-foreground font-light">Produtos de alta qualidade garantida</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
