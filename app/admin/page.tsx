import Link from "next/link";

const tiles = [
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/familias", label: "Famílias" },
  { href: "/admin/tecidos", label: "Tecidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/pedidos", label: "Pedidos" },
];

export default function AdminHome() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Dashboard</h1>
      <p className="mb-6 text-gray-600">Acesse os módulos do backoffice:</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded border p-4 shadow-sm transition hover:shadow"
          >
            <div className="text-lg font-medium">{t.label}</div>
            <div className="mt-2 text-sm text-gray-500">{t.href.replace("/admin/", "Gerenciar ")}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}




