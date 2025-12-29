"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [pedidosAtualizacoes, setPedidosAtualizacoes] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Buscar logo do site
  useEffect(() => {
    fetch("/api/site-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
        }
      })
      .catch(() => {});
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto w-full px-4 md:px-6 lg:px-8 py-4 md:py-5">
        {/* Primeira linha: Logo, Menu, Busca e Ações */}
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex-shrink-0"
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="h-10 md:h-12 w-auto object-contain"
              />
            ) : (
              <span className="text-2xl md:text-3xl font-light text-foreground hover:text-primary transition-colors duration-300">
                AI Sofá
              </span>
            )}
          </Link>

          {/* Menu de Navegação com Dropdown - Desktop */}
          <div className="hidden md:flex items-center gap-6" ref={dropdownRef}>
            {/* Móveis */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(dropdownOpen === "moveis" ? null : "moveis")}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
              >
                Móveis
                <svg 
                  className={`h-4 w-4 transition-transform ${dropdownOpen === "moveis" ? "rotate-180" : ""}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen === "moveis" && (
                <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg py-2 z-50">
                  <Link 
                    href="/categorias" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setDropdownOpen(null)}
                  >
                    Todos os Móveis
                  </Link>
                  <Link 
                    href="/produtos" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setDropdownOpen(null)}
                  >
                    Ver Produtos
                  </Link>
                </div>
              )}
            </div>

            {/* Novidades */}
            <Link 
              href="/produtos?sortBy=newest"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
            >
              Novidades
            </Link>

            {/* Descontos */}
            <Link 
              href="/produtos?comDesconto=true"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
            >
              Descontos
            </Link>
          </div>

          {/* Barra de Pesquisa - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 pr-10 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Barra de Pesquisa - Mobile */}
          <form onSubmit={handleSearch} className="md:hidden flex-1 mx-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 pr-10 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Ações do lado direito */}
          <div className="hidden items-center gap-6 md:flex">
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
                      <span className="ml-2">Carrinho</span>
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
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

          {/* Botão Menu Mobile */}
          <button
            className="md:hidden p-2 text-foreground hover:text-primary transition-colors duration-300 flex-shrink-0"
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
              href="/produtos"
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Móveis
            </Link>
            <Link 
              href="/produtos?sortBy=newest"
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Novidades
            </Link>
            <Link 
              href="/produtos?comDesconto=true"
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Descontos
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
      </div>
    </nav>
  );
}

