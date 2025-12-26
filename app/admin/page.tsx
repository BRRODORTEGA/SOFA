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
      <h1 className="mb-2 text-3xl font-bold text-gray-900">Início</h1>
      <p className="mb-8 text-base text-gray-600">Acesse os módulos do backoffice:</p>
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




