import Link from "next/link";

const tiles = [
  { href: "/admin/configuracoes-site", label: "Configurações do Site", description: "Gerenciar exibição da página inicial" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/familias", label: "Famílias" },
  { href: "/admin/tecidos", label: "Tecidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/tabela-preco", label: "Tabela de Preço" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export default function AdminHome() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Início</h1>
          <p className="text-base text-gray-600">Acesse os módulos do backoffice:</p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Ver Site
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div className="text-xl font-semibold text-gray-900 group-hover:text-blue-700">{t.label}</div>
            <div className="mt-2 text-sm font-medium text-gray-500">
              {t.description || t.href.replace("/admin/", "Gerenciar ")}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}




