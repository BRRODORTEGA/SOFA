import "../../styles/globals.css";
import "../../styles/tailwind.css";
import Navbar from "@/components/storefront/Navbar";
import Footer from "@/components/storefront/Footer";
import { Providers } from "@/components/providers";
import { getSiteConfig } from "@/lib/site-config-cache";

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = await getSiteConfig();
  const footerConfig = siteConfig
    ? {
        titulo: siteConfig.rodapeTitulo ?? "AI Sofá",
        descricao: siteConfig.rodapeDescricao ?? "Sofás sob medida com o conforto que você merece. Qualidade, estilo e personalização em cada detalhe.",
        contato: siteConfig.rodapeContato ?? "Entre em contato conosco através do canal de mensagens do seu pedido. Estamos sempre prontos para ajudar.",
        copyright: siteConfig.rodapeCopyright ?? "© {ano} AI Sofá. Todos os direitos reservados.",
        politicaPrivacidadeUrl: (siteConfig as any).rodapePoliticaPrivacidadeUrl ?? null,
        trocasDevolucaoUrl: (siteConfig as any).rodapeTrocasDevolucaoUrl ?? null,
      }
    : undefined;

  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col bg-white">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer config={footerConfig} />
          </div>
        </Providers>
      </body>
    </html>
  );
}

