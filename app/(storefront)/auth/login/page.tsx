"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const messageParam = searchParams.get("message");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Mensagem de informação baseada no parâmetro
  const infoMessage = messageParam === "login_required" 
    ? "Realize o login para continuar suas compras"
    : messageParam === "email_verified"
    ? "E-mail verificado com sucesso! Faça login para continuar."
    : null;

  // Redirecionar automaticamente se já estiver logado
  useEffect(() => {
    if (session?.user) {
      const role = (session.user as any)?.role;
      if (role === "ADMIN" || role === "OPERADOR") {
        router.push("/admin");
      } else if (callbackUrl && callbackUrl !== "/") {
        router.push(callbackUrl);
      }
    }
  }, [session, router, callbackUrl]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha incorretos");
        setLoading(false);
      } else {
        // Aguardar um pouco para a sessão ser atualizada
        setTimeout(() => {
          // Verificar o role do usuário para redirecionar corretamente
          fetch("/api/auth/session")
            .then((res) => res.json())
            .then((session) => {
              const userRole = session?.user?.role;
              // Se for ADMIN ou OPERADOR, redirecionar para /admin
              if (userRole === "ADMIN" || userRole === "OPERADOR") {
                router.push("/admin");
              } else {
                // Caso contrário, usar o callbackUrl ou ir para home
                router.push(callbackUrl || "/");
              }
              router.refresh();
            })
            .catch(() => {
              // Se der erro, redirecionar para home
              router.push(callbackUrl || "/");
            });
        }, 500);
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-12 px-4">
      <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Entrar</h1>

      {infoMessage && (
        <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 p-4 text-sm text-blue-800">
          <div className="flex items-start gap-2">
            <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-medium">{infoMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Não tem conta?{" "}
        <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-700">
          Cadastre-se
        </Link>
      </p>

      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-xs text-gray-600">
          <strong>Logins de teste:</strong>
          <br />
          ADMIN: admin@gmail.com / admin
          <br />
          OPERADOR: op@local / op
          <br />
          CLIENTE: cli@local / cli
        </p>
      </div>
    </div>
  );
}

