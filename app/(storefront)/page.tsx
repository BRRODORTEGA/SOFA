import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/lib/site-config-cache";
import { getPrecosMinimosEmLote } from "@/lib/preco-batch";
import { ProductListingSection } from "@/components/storefront/ProductListingSection";

export default async function HomePage() {
  const siteConfig = (await getSiteConfig()) as any;

  // Filtros de produtos ativos (tabela vigente)
  const produtosAtivosFilterContagem: any = { status: true };
  const produtosAtivosFilter: any = { status: true };
  if (siteConfig?.tabelaPrecoVigenteId) {
    const ids = siteConfig.produtosAtivosTabelaVigente || [];
    produtosAtivosFilterContagem.id = ids.length > 0 ? { in: ids } : { in: [] };
    produtosAtivosFilter.id = ids.length > 0 ? { in: ids } : { in: [] };
  }

  // Paralelizar: categorias, famílias, produtos em destaque e best sellers em uma única rodada
  const [categorias, familias, produtosRaw, produtosBestSellersRaw] = await Promise.all([
    prisma.categoria.findMany({
      where: { ativo: true },
      include: {
        _count: {
          select: {
            produtos: { where: produtosAtivosFilterContagem },
          },
        },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.familia.findMany({
      where: { ativo: true },
      include: {
        _count: {
          select: {
            produtos: { where: produtosAtivosFilterContagem },
          },
        },
      },
      orderBy: { nome: "asc" },
    }),
    (siteConfig.produtosDestaque?.length ?? 0) > 0
      ? prisma.produto.findMany({
          where: {
            id: { in: siteConfig.produtosDestaque },
            status: true,
          },
          include: {
            familia: { select: { nome: true } },
            categoria: { select: { nome: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : prisma.produto.findMany({
          where: produtosAtivosFilter,
          include: {
            familia: { select: { nome: true } },
            categoria: { select: { nome: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
    prisma.produto.findMany({
      where: produtosAtivosFilter,
      include: {
        familia: { select: { nome: true } },
        categoria: { select: { nome: true } },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Uma única consulta em lote para preços de todos os produtos (evita N+1)
  const todosIds = [...new Set([...produtosRaw.map((p) => p.id), ...produtosBestSellersRaw.map((p) => p.id)])];
  const precoMap = await getPrecosMinimosEmLote(todosIds, siteConfig?.tabelaPrecoVigenteId ?? null);
  const descontos = (siteConfig?.descontosProdutosDestaque as Record<string, number>) || {};

  const enriquecer = (produto: (typeof produtosRaw)[0]) => {
    const { preco: precoOriginal, desconto: descontoLinha } = precoMap.get(produto.id) ?? { preco: null, desconto: null };
    const descontoProdutoDestaque = descontos[produto.id] || 0;
    const descontoPercentual = Math.max(descontoProdutoDestaque, descontoLinha || 0);
    const precoComDesconto =
      precoOriginal && descontoPercentual > 0 ? precoOriginal * (1 - descontoPercentual / 100) : precoOriginal;
    return {
      ...produto,
      precoOriginal,
      precoComDesconto,
      descontoPercentual: descontoPercentual > 0 ? descontoPercentual : undefined,
    };
  };

  const produtos = produtosRaw.map(enriquecer);
  const produtosBestSellers = produtosBestSellersRaw.map(enriquecer);

  // Obter configurações do hero com valores padrão
  const siteConfigTypedHero = siteConfig as any;
  const heroTipo = siteConfigTypedHero?.heroTipo || "texto";
  const heroTitulo = siteConfigTypedHero?.heroTitulo || "Sofás sob medida com o conforto que você merece";
  const heroSubtitulo = siteConfigTypedHero?.heroSubtitulo || "Escolha seu modelo, tecido e medida ideal. Personalize seu sofá do jeito que você sempre sonhou.";
  const heroBotaoTexto = siteConfigTypedHero?.heroBotaoTexto || "Ver Catálogo";
  const heroBotaoLink = siteConfigTypedHero?.heroBotaoLink || "/categorias";
  const heroImagemUrl = siteConfigTypedHero?.heroImagemUrl || null;
  const heroImagemLink = siteConfigTypedHero?.heroImagemLink || null;
  const heroImagemObjectFit = siteConfigTypedHero?.heroImagemObjectFit || "cover";
  const heroImagemObjectPosition = siteConfigTypedHero?.heroImagemObjectPosition || "center";

  // Categorias em destaque (ordem e imagens customizadas pelo admin)
  const categoriasDestaqueIds = (siteConfigTypedHero?.categoriasDestaque as string[] | undefined) ?? [];
  const categoriasDestaqueImagens = (siteConfigTypedHero?.categoriasDestaqueImagens as Record<string, string> | undefined) ?? {};
  const categoriasEmDestaque = categoriasDestaqueIds
    .map((id) => categorias.find((c) => c.id === id))
    .filter((c): c is (typeof categorias)[number] => c != null);

  return (
    <div className="overflow-hidden">
      {/* Hero Section - Mais Impactante */}
      <section className={`relative ${heroTipo === "imagem" && heroImagemUrl ? "min-h-[500px] md:min-h-[600px] lg:min-h-[700px]" : "bg-gradient-to-br from-bg-2 via-bg-3 to-bg-4 py-20 md:py-32 lg:py-40"}`}>
        {heroTipo === "imagem" && heroImagemUrl ? (
          <>
            {/* Hero com Imagem - Clicável se houver link */}
            <div className="absolute inset-0 overflow-hidden">
              {heroImagemLink ? (
                <Link href={heroImagemLink} className="block h-full w-full cursor-pointer">
                  <img
                    src={heroImagemUrl}
                    alt="Hero Banner"
                    className="h-full w-full transition-transform duration-300 hover:scale-105"
                    style={{
                      objectFit: heroImagemObjectFit as any,
                      objectPosition: heroImagemObjectPosition,
                    }}
                  />
                </Link>
              ) : (
                <img
                  src={heroImagemUrl}
                  alt="Hero Banner"
                  className="h-full w-full"
                  style={{
                    objectFit: heroImagemObjectFit as any,
                    objectPosition: heroImagemObjectPosition,
                  }}
                />
              )}
            </div>
          </>
        ) : (
          <>
            {/* Hero com Texto */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
            <div className="relative mx-auto px-4 md:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl text-center">
                <h1 className="text-display font-light text-foreground mb-6 leading-[115%]">
                  {heroTitulo}
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground font-light leading-[150%] max-w-2xl mx-auto mb-10">
                  {heroSubtitulo}
                </p>
                <Link
                  href={heroBotaoLink}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-primary-foreground font-medium hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {heroBotaoTexto}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Categorias em Destaque - abaixo do banner */}
      {categoriasEmDestaque.length > 0 && (
        <section className="py-10 md:py-14 bg-background">
          <div className="mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
            <h2 className="text-center text-2xl md:text-3xl font-semibold text-primary mb-8 md:mb-10">
              Categorias em Destaque
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-6">
              {categoriasEmDestaque.map((cat) => {
                const imagemUrl = categoriasDestaqueImagens[cat.id];
                return (
                  <Link
                    key={cat.id}
                    href={`/produtos?categoriaId=${cat.id}`}
                    className="group flex flex-col items-center rounded-lg border border-border bg-card p-3 md:p-4 transition-all hover:shadow-md hover:border-primary/30"
                  >
                    <div className="relative h-24 w-full md:h-32 overflow-hidden rounded-md bg-muted mb-2 md:mb-3">
                      {imagemUrl ? (
                        <img
                          src={imagemUrl}
                          alt={cat.nome}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <svg className="h-10 w-10 md:h-12 md:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-center text-sm font-medium text-foreground group-hover:text-primary">
                      {cat.nome}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Seção de Produtos com Sidebar e Grid */}
      <section className="py-8 md:py-12 bg-background">
        <div className="mx-auto px-4 md:px-6 lg:px-8">
          <ProductListingSection
            categorias={categorias.map(cat => ({
              id: cat.id,
              nome: cat.nome,
              _count: { produtos: cat._count?.produtos || 0 }
            }))}
            familias={familias.map(fam => ({
              id: fam.id,
              nome: fam.nome,
              _count: { produtos: fam._count?.produtos || 0 }
            }))}
            produtosIniciais={produtos.map(p => ({
              id: p.id,
              nome: p.nome,
              imagens: p.imagens || [],
              familia: p.familia,
              categoria: p.categoria,
              preco: p.precoComDesconto || p.precoOriginal || null,
              precoOriginal: p.precoOriginal || null,
              precoComDesconto: p.precoComDesconto || null,
              descontoPercentual: p.descontoPercentual,
              tipo: p.tipo,
              abertura: p.abertura
            }))}
            produtosBestSellers={produtosBestSellers.map(p => ({
              id: p.id,
              nome: p.nome,
              imagens: p.imagens || [],
              familia: p.familia,
              categoria: p.categoria,
              preco: p.precoComDesconto || p.precoOriginal || null,
              precoOriginal: p.precoOriginal || null,
              precoComDesconto: p.precoComDesconto || null,
              descontoPercentual: p.descontoPercentual,
              tipo: p.tipo,
              abertura: p.abertura
            }))}
          />
        </div>
      </section>

      {/* Seção de Confiança */}
      <section className="py-12 md:py-16 bg-background border-t border-border">
        <div className="mx-auto px-4 md:px-6 lg:px-8">
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
