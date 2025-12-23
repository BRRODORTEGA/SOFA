"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [pedidosAtualizacoes, setPedidosAtualizacoes] = useState(0);

  // Buscar quantidade de itens no carrinho
  useEffect(() => {
    if (session && (session.user as any)?.role !== "ADMIN" && (session.user as any)?.role !== "OPERADOR") {
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.data?.itens) {
            const totalItems = data.data.itens.reduce((acc: number, item: any) => {
              return acc + (item.quantidade || 0);
            }, 0);
            setCartItemCount(totalItems);
          }
        })
        .catch(() => {
          setCartItemCount(0);
        });
    } else {
      setCartItemCount(0);
    }
  }, [session]);

  // Atualizar contador quando a página receber foco (usuário volta de outra aba)
  useEffect(() => {
    const handleFocus = () => {
      if (session && (session.user as any)?.role !== "ADMIN" && (session.user as any)?.role !== "OPERADOR") {
        fetch("/api/cart")
          .then((res) => res.json())
          .then((data) => {
            if (data.ok && data.data?.itens) {
              const totalItems = data.data.itens.reduce((acc: number, item: any) => {
                return acc + (item.quantidade || 0);
              }, 0);
              setCartItemCount(totalItems);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [session]);

  // Buscar atualizações de pedidos
  useEffect(() => {
    if (session && (session.user as any)?.role !== "ADMIN" && (session.user as any)?.role !== "OPERADOR") {
      fetch("/api/meus-pedidos")
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.data?.items) {
            const totalAtualizacoes = data.data.items.filter((p: any) => p.temAtualizacao).length;
            setPedidosAtualizacoes(totalAtualizacoes);
          }
        })
        .catch(() => {
          setPedidosAtualizacoes(0);
        });
    } else {
      setPedidosAtualizacoes(0);
    }
  }, [session]);

  // Atualizar contador de atualizações quando a página receber foco
  useEffect(() => {
    const handleFocus = () => {
      if (session && (session.user as any)?.role !== "ADMIN" && (session.user as any)?.role !== "OPERADOR") {
        fetch("/api/meus-pedidos")
          .then((res) => res.json())
          .then((data) => {
            if (data.ok && data.data?.items) {
              const totalAtualizacoes = data.data.items.filter((p: any) => p.temAtualizacao).length;
              setPedidosAtualizacoes(totalAtualizacoes);
            }
          })
          .catch(() => {});
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [session]);

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
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
          >
            <svg 
              className="h-5 w-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            <span>Início</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
          </Link>
          <Link 
            href="/categorias" 
            className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
          >
            <svg 
              className="h-5 w-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
              />
            </svg>
            <span>Categorias</span>
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
                    className="relative flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 group"
                  >
                    <div className="relative">
                      <svg 
                        className="h-5 w-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                        />
                      </svg>
                      {cartItemCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </div>
                    <span className="ml-2 hidden md:inline">Carrinho</span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300 hidden md:block"></span>
                  </Link>
                  <Link 
                    href="/meus-pedidos" 
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-300 relative group"
                  >
                    <div className="relative">
                      <svg 
                        className="h-5 w-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                        />
                      </svg>
                      {pedidosAtualizacoes > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                          {pedidosAtualizacoes > 9 ? '9+' : pedidosAtualizacoes}
                        </span>
                      )}
                    </div>
                    <span>Meus Pedidos</span>
                    {pedidosAtualizacoes > 0 && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                      </span>
                    )}
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
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              <svg 
                className="h-5 w-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              <span>Início</span>
            </Link>
            <Link 
              href="/categorias" 
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              <svg 
                className="h-5 w-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
                />
              </svg>
              <span>Categorias</span>
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
                      className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300 relative flex items-center gap-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg 
                        className="h-5 w-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                        />
                      </svg>
                      <span>Carrinho</span>
                      {cartItemCount > 0 && (
                        <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </span>
                      )}
                    </Link>
                    <Link 
                      href="/meus-pedidos" 
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300 relative"
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="relative">
                        <svg 
                          className="h-5 w-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                          />
                        </svg>
                        {pedidosAtualizacoes > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                            {pedidosAtualizacoes > 9 ? '9+' : pedidosAtualizacoes}
                          </span>
                        )}
                      </div>
                      <span>Meus Pedidos</span>
                      {pedidosAtualizacoes > 0 && (
                        <span className="ml-auto relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                        </span>
                      )}
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

