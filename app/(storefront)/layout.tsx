import "../../styles/globals.css";
import "../../styles/tailwind.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { Providers } from "@/components/providers";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <SiteHeader />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}

