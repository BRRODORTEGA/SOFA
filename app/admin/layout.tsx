import "../../styles/globals.css";
import "../../styles/tailwind.css";
import { Providers } from "@/components/providers";
import { requireAdminSession } from "@/lib/auth-guard";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { AdminNavItem } from "@/components/admin/AdminNavItem";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession(); // protege TUDO abaixo de /admin
  const role = session.user?.role || "CLIENTE";

  // Pedidos que exigem atenção: Solicitado, nunca visualizados, nova msg do cliente ou atualização
  let pedidosComSinal = 0;
  try {
    const r = await prisma.$queryRawUnsafe<[{ count: number }]>(
      `SELECT COUNT(*)::int AS count FROM "Pedido" p
       WHERE p.status = 'Solicitado'
          OR p."ultimaVisualizacaoAdmin" IS NULL
          OR EXISTS (
            SELECT 1 FROM "MensagemPedido" m
            WHERE m."pedidoId" = p.id AND m.role = 'CLIENTE'
            AND m."createdAt" > COALESCE(p."ultimaVisualizacaoAdmin", '1970-01-01')
          )
          OR (p."ultimaVisualizacaoAdmin" IS NOT NULL AND p."updatedAt" > p."ultimaVisualizacaoAdmin")`
    );
    pedidosComSinal = Number(r[0]?.count ?? 0);
  } catch {
    // Fallback: só contar Solicitado se a coluna não existir
    pedidosComSinal = await prisma.pedido.count({ where: { status: "Solicitado" } });
  }

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
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Geral</div>
                <Link 
                  href="/" 
                  target="_blank"
                  className="mb-2 flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Ver Site
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin">
                  🏠 Início
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/configuracoes-site">
                  ⚙️ Configuração do Site
                </Link>
                <div className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Dashboards</div>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/dashboard">
                  📊 Dashboard Geral
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/dashboard/pedidos">
                  📈 Painel Executivo de Pedidos
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/dashboard-vendas">
                  📊 Dashboard de Vendas
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
                <AdminNavItem
                  label="Produtos"
                  icon="📦"
                  subItems={[
                    { href: "/admin/produtos", label: "Lista de Produtos", icon: "📦" },
                    { href: "/admin/nomes-padrao-produto", label: "Nomes Padrão", icon: "📝" },
                  ]}
                />
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/tabela-preco">
                  💰 Tabela de Preço
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/tabelas-preco">
                  📋 Gestão de Tabelas de Preços
                </Link>

                <div className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Operação</div>
                <Link className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/pedidos">
                  <span className="flex items-center gap-2">🛒 Pedidos</span>
                  {pedidosComSinal > 0 && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white" title={`${pedidosComSinal} pedido(s) com novidade ou pendente`}>
                      {pedidosComSinal > 99 ? "99+" : pedidosComSinal}
                    </span>
                  )}
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/clientes">
                  👥 Clientes
                </Link>
                <Link className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700" href="/admin/alterar-senha">
                  🔐 Alterar senha do admin
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



