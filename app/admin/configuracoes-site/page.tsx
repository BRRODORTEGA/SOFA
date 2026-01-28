import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ConfiguracoesSiteForm from "./ConfiguracoesSiteForm";

export default async function ConfiguracoesSitePage() {
  // Buscar ou criar a configuração do site
  let siteConfig = await prisma.siteConfig.findUnique({
    where: { id: "site-config" },
    include: {
      tabelaPrecoVigente: true,
    },
  });

  // Se não existir, criar uma configuração padrão
  if (!siteConfig) {
    siteConfig = await prisma.siteConfig.create({
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
  }

  // Buscar todas as categorias ativas
  const categorias = await prisma.categoria.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  // Buscar todos os produtos ativos com informações básicas
  const produtos = await prisma.produto.findMany({
    where: { status: true },
    include: {
      categoria: { select: { nome: true } },
      familia: { select: { nome: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Buscar todas as tabelas de preço ativas
  const tabelasPreco = await prisma.tabelaPreco.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações do Site</h1>
        <p className="mt-2 text-base text-gray-600">
          Gerencie as configurações de exibição da página inicial do site
        </p>
      </div>

      <ConfiguracoesSiteForm
        siteConfig={siteConfig as any}
        categorias={categorias}
        produtos={produtos}
        tabelasPreco={tabelasPreco}
      />
    </div>
  );
}

