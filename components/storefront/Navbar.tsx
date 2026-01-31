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
  const [searchOpen, setSearchOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [ambientes, setAmbientes] = useState<{ id: string; nome: string }[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const ambientesDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Buscar ambientes ativos para o menu AMBIENTES
  useEffect(() => {
    fetch("/api/ambientes?ativo=true&limit=100&comProdutosTabelaVigente=true")
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data?.data?.items) {
          setAmbientes(data.data.items);
        }
      })
      .catch(() => {});
  }, []);

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

  // Fechar dropdown e busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (dropdownOpen === "account" && accountDropdownRef.current && !accountDropdownRef.current.contains(target)) {
        setDropdownOpen(null);
      }
      if (dropdownOpen === "ambientes" && ambientesDropdownRef.current && !ambientesDropdownRef.current.contains(target)) {
        setDropdownOpen(null);
      }
      
      if (searchOpen) {
        const isSearchButton = target.closest('.search-button');
        const isSearchInput = searchInputRef.current && searchInputRef.current.contains(target);
        const isSearchForm = target.closest('form');
        
        if (!isSearchButton && !isSearchInput && !isSearchForm) {
          setSearchOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchOpen, dropdownOpen]);

  // Focar no input quando abrir
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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

  // Ao abrir um pedido (marcar como visualizado), atualizar o badge do menu "Meus Pedidos"
  useEffect(() => {
    const onPedidosVisualizados = () => {
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
    window.addEventListener("pedidos-visualizados", onPedidosVisualizados);
    return () => window.removeEventListener("pedidos-visualizados", onPedidosVisualizados);
  }, [session]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
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

          {/* Menu de Navegação - Desktop */}
          <div className="hidden md:flex items-center gap-6" ref={dropdownRef}>
            {/* Home */}
            <Link 
              href="/"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
            >
              Home
            </Link>

            {/* AMBIENTES - dropdown */}
            <div className="relative" ref={ambientesDropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(dropdownOpen === "ambientes" ? null : "ambientes")}
                onMouseEnter={() => ambientes.length > 0 && setDropdownOpen("ambientes")}
                className={`flex items-center gap-1 text-sm font-medium transition-colors duration-300 ${
                  dropdownOpen === "ambientes" ? "text-primary" : "text-foreground hover:text-primary"
                }`}
                aria-expanded={dropdownOpen === "ambientes"}
                aria-haspopup="true"
              >
                Ambientes
                <svg
                  className={`h-4 w-4 transition-transform ${dropdownOpen === "ambientes" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {dropdownOpen === "ambientes" && ambientes.length > 0 && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
                  onMouseLeave={() => setDropdownOpen(null)}
                >
                  {ambientes.map((a) => (
                    <Link
                      key={a.id}
                      href={`/produtos?ambienteId=${encodeURIComponent(a.id)}`}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => setDropdownOpen(null)}
                    >
                      {a.nome}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Coleção */}
            <Link 
              href="/produtos"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
            >
              Coleção
            </Link>

            {/* Pronta Entrega */}
            <Link 
              href="/pronta-entrega"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
            >
              Pronta Entrega
            </Link>

            {/* Nossa História */}
            <Link 
              href="/nossa-historia"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
            >
              Nossa História
            </Link>

            {/* Contatos */}
            <Link 
              href="/contatos"
              className="text-sm font-medium text-foreground hover:text-primary transition-colors duration-300"
            >
              Contatos
            </Link>
          </div>

          {/* Barra de Pesquisa - Desktop */}
          <div className="hidden md:flex items-center mx-8">
            {!searchOpen ? (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="search-button text-gray-400 hover:text-gray-600 transition-colors duration-300 p-2"
                aria-label="Abrir busca"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            ) : (
              <form onSubmit={handleSearch} className="flex items-center relative z-50">
                <div className="relative" ref={searchInputRef}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }
                    }}
                    placeholder="Buscar no site..."
                    className="w-64 rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 pr-10 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 pointer-events-none"
                    tabIndex={-1}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Fechar busca"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Barra de Pesquisa - Mobile */}
          <div className="md:hidden flex items-center mx-2">
            {!searchOpen ? (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="search-button text-gray-400 hover:text-gray-600 transition-colors duration-300 p-2"
                aria-label="Abrir busca"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            ) : (
              <form onSubmit={handleSearch} className="flex items-center w-full relative z-50">
                <div className="relative w-full" ref={searchInputRef}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }
                    }}
                    placeholder="Buscar no site..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 pr-10 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                    autoComplete="off"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    tabIndex={-1}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Fechar busca"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>

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
                    {/* Dropdown Conta do usuário */}
                    <div className="relative" ref={accountDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(dropdownOpen === "account" ? null : "account")}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-bg-2 transition-colors duration-300"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Olá, {(session.user?.name as string)?.split(" ")[0]?.toUpperCase() || "Usuário"}</span>
                        <svg className={`h-4 w-4 transition-transform ${dropdownOpen === "account" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {dropdownOpen === "account" && (
                        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-white py-1 shadow-lg">
                          <Link
                            href="/meus-dados"
                            className="block px-4 py-2.5 text-sm text-foreground hover:bg-bg-2"
                            onClick={() => setDropdownOpen(null)}
                          >
                            Minha Conta
                          </Link>
                          <Link
                            href="/meus-pedidos"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-bg-2"
                            onClick={() => setDropdownOpen(null)}
                          >
                            Meus pedidos
                            {pedidosAtualizacoes > 0 && (
                              <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                {pedidosAtualizacoes > 9 ? "9+" : pedidosAtualizacoes}
                              </span>
                            )}
                          </Link>
                          <Link
                            href="/meus-dados/enderecos"
                            className="block px-4 py-2.5 text-sm text-foreground hover:bg-bg-2"
                            onClick={() => setDropdownOpen(null)}
                          >
                            Meus endereços
                          </Link>
                          <Link
                            href="/meus-dados/editar"
                            className="block px-4 py-2.5 text-sm text-foreground hover:bg-bg-2"
                            onClick={() => setDropdownOpen(null)}
                          >
                            Editar informações da conta
                          </Link>
                          <div className="border-t border-border my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setDropdownOpen(null);
                              signOut({ callbackUrl: "https://domuxdesign.com.br" });
                            }}
                            className="block w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-bg-2"
                          >
                            Sair
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
                {((session.user as any)?.role === "ADMIN" || (session.user as any)?.role === "OPERADOR") && (
                  <div className="flex items-center gap-4 pl-4 border-l border-border">
                    <span className="text-sm text-muted-foreground font-light">{session.user?.email}</span>
                    <button
                      onClick={() => signOut({ callbackUrl: "https://domuxdesign.com.br" })}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-bg-2 hover:border-gray-1 transition-all duration-300"
                    >
                      Sair
                    </button>
                  </div>
                )}
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
              href="/"
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            {ambientes.length > 0 && (
              <div className="border-b border-border pb-2 mb-2">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ambientes</div>
                {ambientes.map((a) => (
                  <Link
                    key={a.id}
                    href={`/produtos?ambienteId=${encodeURIComponent(a.id)}`}
                    className="block px-6 py-2 text-sm text-foreground hover:bg-bg-2 rounded-lg transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    {a.nome}
                  </Link>
                ))}
              </div>
            )}
            <Link 
              href="/produtos"
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Coleção
            </Link>
            <Link 
              href="/pronta-entrega"
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Pronta Entrega
            </Link>
            <Link 
              href="/nossa-historia"
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Nossa História
            </Link>
            <Link 
              href="/contatos"
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
              onClick={() => setMenuOpen(false)}
            >
              Contatos
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
                      <span>Meus pedidos</span>
                      {pedidosAtualizacoes > 0 && (
                        <span className="ml-auto relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                        </span>
                      )}
                    </Link>
                    <Link 
                      href="/meus-dados" 
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Minha Conta</span>
                    </Link>
                    <Link 
                      href="/meus-dados/enderecos" 
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Meus endereços</span>
                    </Link>
                    <Link 
                      href="/meus-dados/editar" 
                      className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-foreground hover:bg-bg-2 rounded-lg transition-colors duration-300"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Editar informações da conta</span>
                    </Link>
                  </>
                )}
                <div className="px-4 py-3 border-t border-border mt-2">
                  <span className="text-sm text-muted-foreground font-light block mb-3">{session.user?.email}</span>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "https://domuxdesign.com.br" });
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

