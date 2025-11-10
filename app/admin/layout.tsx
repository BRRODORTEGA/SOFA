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
      <body>
        <Providers>
          <div className="grid min-h-screen grid-cols-12">
            <aside className="col-span-3 border-r p-4">
              <div className="mb-2 text-lg font-semibold">Admin</div>
              <div className="mb-6 text-xs text-gray-500">Logado como: <span className="font-medium">{session.user?.email}</span> ({role})</div>
              <nav className="space-y-2 text-sm">
                <Link className="block rounded px-2 py-1 hover:bg-gray-100" href="/admin">Dashboard</Link>
                <div className="mt-4 text-xs font-semibold uppercase text-gray-500">Cadastros</div>
                <Link className="block rounded px-2 py-1 hover:bg-gray-100" href="/admin/categorias">Categorias</Link>
                <Link className="block rounded px-2 py-1 hover:bg-gray-100" href="/admin/familias">Famílias</Link>
                <Link className="block rounded px-2 py-1 hover:bg-gray-100" href="/admin/tecidos">Tecidos</Link>
                <Link className="block rounded px-2 py-1 hover:bg-gray-100" href="/admin/produtos">Produtos</Link>

                <div className="mt-4 text-xs font-semibold uppercase text-gray-500">Operação</div>
                <Link className="block rounded px-2 py-1 hover:bg-gray-100" href="/admin/pedidos">Pedidos</Link>
              </nav>
              <div className="mt-8">
                <LogoutButton />
              </div>
            </aside>
            <main className="col-span-9 p-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}



