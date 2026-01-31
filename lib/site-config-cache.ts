import { cache } from "react";
import { prisma } from "./prisma";

/**
 * SiteConfig em cache por request: layout e page compartilham a mesma leitura,
 * evitando duas consultas ao banco na abertura da página inicial.
 */
export const getSiteConfig = cache(async () => {
  let config = await prisma.siteConfig.findUnique({
    where: { id: "site-config" },
  });
  if (!config) {
    config = await prisma.siteConfig.create({
      data: {
        id: "site-config",
        categoriasDestaque: [],
        produtosDestaque: [],
        produtosAtivosTabelaVigente: [],
        ordemCategorias: [],
      },
    });
  }
  return config;
});
