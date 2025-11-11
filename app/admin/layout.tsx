import "../../styles/globals.css";
import "../../styles/tailwind.css";
import { Providers } from "@/components/providers";
import { requireAdminSession } from "@/lib/auth-guard";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession(); // protege TUDO abaixo de /admin
  const role = session.user?.role || "CLIENTE";

  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased">
        <Providers>
          <div className="grid min-h-screen grid-cols-12 bg-gray-50">
            <aside className="col-span-3 border-r border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 text-2xl font-bold text-gray-900">Admin</div>
              <div className="mb-6 rounded-lg bg-blue-50 p-3 text-sm text-gray-700">
                <div className="font-semibold text-gray-900">{session.user?.email}</div>
                <div className="mt-1 text-xs text-gray-600">Role: <span className="font-medium text-blue-700">{role}</span></div>
              </div>
              <nav className="space-y-1">
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin">
                  📊 Dashboard
                </Link>
                <div className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Cadastros</div>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/categorias">
                  📁 Categorias
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/familias">
                  🏷️ Famílias
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/tecidos">
                  🧵 Tecidos
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/produtos">
                  📦 Produtos
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/tabela-preco">
                  💰 Tabela de Preço
                </Link>

                <div className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Operação</div>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/pedidos">
                  🛒 Pedidos
                </Link>
              </nav>
              <div className="mt-8 border-t border-gray-200 pt-4">
                <LogoutButton />
              </div>
            </aside>
            <main className="col-span-9 bg-gray-50 p-8">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}



