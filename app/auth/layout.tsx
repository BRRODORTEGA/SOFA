import "../../styles/globals.css";
import "../../styles/tailwind.css";
import { Providers } from "@/components/providers";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          <div className="flex min-h-screen items-center justify-center">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}



