"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

const navItems = [
  { href: "/meus-dados", label: "Minha Conta" },
  { href: "/meus-pedidos", label: "Meus pedidos" },
  { href: "/meus-dados/enderecos", label: "Meus Endereços" },
  { href: "/meus-dados/editar", label: "Editar informações da conta" },
];

export default function MeusDadosLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/meus-dados");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:gap-12 lg:px-8">
      {/* Sidebar */}
      <aside className="w-full shrink-0 md:w-56">
        <nav className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                item.href === "/meus-dados"
                  ? pathname === "/meus-dados"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } ${isActive ? "border-l-4 border-primary pl-2" : ""}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Conteúdo */}
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
