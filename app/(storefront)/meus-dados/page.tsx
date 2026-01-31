"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MinhaContaPage() {
  const { data: session } = useSession();
  const [user, setUser] = useState<{
    name?: string | null;
    sobrenome?: string | null;
    email?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setUser(data);
      })
      .catch(() => {});
  }, [session?.user?.email]);

  const displayName = user
    ? [user.name, user.sobrenome].filter(Boolean).join(" ") || user.name || "—"
    : (session?.user?.name as string) || "—";
  const email = user?.email ?? (session?.user?.email as string) ?? "—";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para o site
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Minha Conta</h1>
      </div>

      {/* Informações de Conta */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-900">
          Informações de Conta
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-500">Informações de Contato</h3>
            <p className="text-gray-900">{displayName}</p>
            <p className="mt-1 text-gray-600">{email}</p>
            <div className="mt-3 flex gap-3">
              <Link
                href="/meus-dados/editar"
                className="text-sm font-medium text-primary hover:underline"
              >
                EDITAR
              </Link>
              <Link
                href="/meus-dados/editar#senha"
                className="text-sm font-medium text-primary hover:underline"
              >
                ALTERAR SENHA
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-500">Newsletter</h3>
            <p className="text-sm text-gray-600">Você não está inscrito na nossa Newsletter.</p>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary hover:underline"
              disabled
            >
              EDITAR
            </button>
          </div>
        </div>
      </section>

      {/* Meus Endereços */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="border-b border-transparent pb-0 text-lg font-semibold text-gray-900">
            Meus Endereços
          </h2>
          <Link
            href="/meus-dados/enderecos"
            className="text-sm font-medium text-primary hover:underline"
          >
            GERENCIAR ENDEREÇOS
          </Link>
        </div>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-500">
              Endereço padrão de cobrança
            </h3>
            <p className="text-sm text-gray-600">
              Você não definiu um endereço de faturamento padrão.
            </p>
            <Link
              href="/meus-dados/enderecos"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              EDITAR O ENDEREÇO
            </Link>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-500">
              Endereço de entrega padrão
            </h3>
            <p className="text-sm text-gray-600">
              Você não definiu um endereço de entrega padrão.
            </p>
            <Link
              href="/meus-dados/enderecos"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              EDITAR O ENDEREÇO
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
