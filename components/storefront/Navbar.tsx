"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-2xl font-bold text-gray-900">
          AI Sofá
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-gray-700 hover:text-gray-900">
            Início
          </Link>
          <Link href="/categorias" className="text-gray-700 hover:text-gray-900">
            Categorias
          </Link>
          {session ? (
            <>
              {(session.user as any)?.role === "ADMIN" || (session.user as any)?.role === "OPERADOR" ? (
                <Link href="/admin" className="text-gray-700 hover:text-gray-900">
                  Admin
                </Link>
              ) : (
                <>
                  <Link href="/cart" className="text-gray-700 hover:text-gray-900">
                    Carrinho
                  </Link>
                  <Link href="/meus-pedidos" className="text-gray-700 hover:text-gray-900">
                    Meus Pedidos
                  </Link>
                </>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">{session.user?.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  Sair
                </button>
              </div>
            </>
          ) : (
            <Link href="/auth/login" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Entrar
            </Link>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t bg-white md:hidden">
          <div className="flex flex-col gap-2 px-4 py-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              Início
            </Link>
            <Link href="/categorias" className="text-gray-700 hover:text-gray-900">
              Categorias
            </Link>
            {session ? (
              <>
                {(session.user as any)?.role === "ADMIN" || (session.user as any)?.role === "OPERADOR" ? (
                  <Link href="/admin" className="text-gray-700 hover:text-gray-900">
                    Admin
                  </Link>
                ) : (
                  <>
                    <Link href="/cart" className="text-gray-700 hover:text-gray-900">
                      Carrinho
                    </Link>
                    <Link href="/meus-pedidos" className="text-gray-700 hover:text-gray-900">
                      Meus Pedidos
                    </Link>
                  </>
                )}
                <span className="text-sm text-gray-600">{session.user?.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded border px-3 py-1 text-left text-sm hover:bg-gray-50"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="rounded bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700">
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

