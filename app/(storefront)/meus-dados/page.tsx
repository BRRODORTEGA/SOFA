"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function MeusDadosPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Carregar dados do usuário
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  // Redirecionar se não estiver logado
  useEffect(() => {
    if (session === null) {
      router.push("/auth/login?redirect=/meus-dados");
    }
  }, [session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validações
    if (!name || name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      setLoading(false);
      return;
    }

    if (!email || !email.includes("@")) {
      setError("E-mail inválido");
      setLoading(false);
      return;
    }

    // Se senha foi preenchida, validar
    if (password) {
      if (password.length < 6) {
        setError("Senha deve ter pelo menos 6 caracteres");
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError("As senhas não coincidem");
        setLoading(false);
        return;
      }
    }

    try {
      const body: any = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
      };

      // Só incluir senha se foi preenchida
      if (password) {
        body.password = password;
      }

      const res = await fetch("/api/user/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMsg = "Erro ao atualizar dados";
        if (data.error) {
          errorMsg = typeof data.error === "string" ? data.error : data.error.message || errorMsg;
        } else if (data.message) {
          errorMsg = data.message;
        }
        setError(errorMsg);
        setLoading(false);
        return;
      }

      // Atualizar sessão
      await update();

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      
      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar dados");
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para o site
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Meus Dados</h1>
        <p className="mt-2 text-gray-600">Atualize suas informações cadastrais</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mensagem de sucesso */}
          {success && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium text-green-800">Dados atualizados com sucesso!</p>
              </div>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Nome */}
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
              Nome Completo *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Seu nome completo"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              E-mail *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              Se você alterar o e-mail, precisará fazer login novamente.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Alterar Senha</h2>
            <p className="mb-4 text-sm text-gray-600">
              Deixe em branco se não desejar alterar a senha.
            </p>
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Nova Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {/* Confirmar Senha */}
          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
              Confirmar Nova Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Digite a senha novamente"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-domux-burgundy-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
            <Link
              href="/"
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      {/* Informações adicionais */}
      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Informações da Conta</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">Tipo de conta:</span>{" "}
            {(session.user as any)?.role === "ADMIN"
              ? "Administrador"
              : (session.user as any)?.role === "OPERADOR"
              ? "Operador"
              : (session.user as any)?.role === "FABRICA"
              ? "Fábrica"
              : "Cliente"}
          </p>
          <p>
            <span className="font-medium">E-mail verificado:</span>{" "}
            {session.user?.email ? "Sim" : "Não"}
          </p>
        </div>
      </div>
    </div>
  );
}

