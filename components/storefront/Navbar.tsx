"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex items-center justify-between px-4 py-4 md:py-5">
        <Link 
          href="/" 
          className="text-2xl md:text-3xl font-light text-foreground hover:text-primary transition-colors duration-300"
        >
          AI Sofá
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <Link 
            href="/" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
          >
            Início
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link 
            href="/categorias" 
            className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
          >
            Categorias
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>
          {session ? (
            <>
              {(session.user as any)?.role === "ADMIN" || (session.user as any)?.role === "OPERADOR" ? (
                <Link 
                  href="/admin" 
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
                >
                  Admin
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>
              ) : (
                <>
                  <Link 
                    href="/cart" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
                  >
                    Carrinho
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                  </Link>
                  <Link 
                    href="/meus-pedidos" 
                    className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
                  >
                    Meus Pedidos
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              )}
              <div className="flex items-center gap-4 pl-4 border-l border-border">
                <span className="text-sm text-muted-foreground font-light">{session.user?.email}</span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-2 hover:border-gray-1 transition-all duration-300"
                >
                  Sair
                </button>
              </div>
            </>
          ) : (
            <Link 
              href="/auth/login" 
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Entrar
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors duration-300"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col gap-1 px-4 py-4">
            <Link 
              href="/" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Início
            </Link>
            <Link 
              href="/categorias" 
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Categorias
            </Link>
            {session ? (
              <>
                {(session.user as any)?.role === "ADMIN" || (session.user as any)?.role === "OPERADOR" ? (
                  <Link 
                    href="/admin" 
                    className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/cart" 
                      className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      Carrinho
                    </Link>
                    <Link 
                      href="/meus-pedidos" 
                      className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      Meus Pedidos
                    </Link>
                  </>
                )}
                <div className="px-4 py-3 border-t border-border mt-2">
                  <span className="text-sm text-muted-foreground font-light block mb-3">{session.user?.email}</span>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/" });
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-bg-2 transition-all duration-300"
                  >
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <Link 
                href="/auth/login" 
                className="mx-4 mt-2 rounded-lg bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all duration-300"
                onClick={() => setMenuOpen(false)}
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

