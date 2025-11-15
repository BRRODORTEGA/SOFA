import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductListingSection } from "@/components/storefront/ProductListingSection";

export default async function HomePage() {
  // Buscar configurações do site
  let siteConfig = await prisma.siteConfig.findUnique({
    where: { id: "site-config" },
  });

  // Se não existir, criar configuração padrão
  if (!siteConfig) {
    siteConfig = await prisma.siteConfig.create({
      data: {
        id: "site-config",
        categoriasDestaque: [],
        produtosDestaque: [],
        ordemCategorias: [],
      },
    });
  }

  // Buscar todas as categorias ativas com contagem de produtos
  const categorias = await prisma.categoria.findMany({
    where: { ativo: true },
    include: {
      _count: {
        select: {
          produtos: {
            where: { status: true }
          }
        }
      }
    },
    orderBy: { nome: "asc" },
  });

  // Buscar todos os produtos ativos para exibição
  const produtos = await prisma.produto.findMany({
    where: { status: true },
    include: {
      familia: { select: { nome: true } },
      categoria: { select: { nome: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Limite inicial
  });

  // Buscar produtos best sellers (top 3 mais recentes por enquanto)
  const produtosBestSellers = await prisma.produto.findMany({
    where: { status: true },
    include: {
      familia: { select: { nome: true } },
      categoria: { select: { nome: true } },
    },
    take: 3,
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

      {/* Seção de Produtos com Sidebar e Grid */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          <ProductListingSection
            categorias={categorias.map(cat => ({
              id: cat.id,
              nome: cat.nome,
              _count: { produtos: cat._count?.produtos || 0 }
            }))}
            produtosIniciais={produtos.map(p => ({
              id: p.id,
              nome: p.nome,
              imagens: p.imagens || [],
              familia: p.familia,
              categoria: p.categoria,
            }))}
            produtosBestSellers={produtosBestSellers.map(p => ({
              id: p.id,
              nome: p.nome,
              imagens: p.imagens || [],
            }))}
          />
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
