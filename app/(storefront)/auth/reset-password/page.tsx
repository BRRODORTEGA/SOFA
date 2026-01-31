"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Link inválido. Solicite um novo link para redefinir a senha.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError("");

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data?.details?.message ?? data?.message ?? data?.error ?? "Erro ao redefinir senha.";
        setError(typeof msg === "string" ? msg : "Link inválido ou expirado. Solicite um novo link.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/auth/login?message=password_reset");
      }, 2000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md py-12 px-4">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Senha alterada</h1>
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">Sua senha foi alterada com sucesso. Redirecionando para o login...</p>
        </div>
        <p className="text-center text-sm text-gray-600">
          <Link href="/auth/login" className="font-medium text-primary hover:text-domux-burgundy-dark">
            Ir para o login
          </Link>
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md py-12 px-4">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Redefinir senha</h1>
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p>Link inválido. Use o link que enviamos por e-mail ou solicite um novo.</p>
        </div>
        <p className="text-center text-sm text-gray-600">
          <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-domux-burgundy-dark">
            Solicitar novo link
          </Link>
          {" · "}
          <Link href="/auth/login" className="font-medium text-primary hover:text-domux-burgundy-dark">
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12 px-4">
      <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Nova senha</h1>
      <p className="mb-4 text-center text-sm text-gray-600">
        Digite e confirme sua nova senha de acesso.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            Nova senha
          </label>
          <input
            id="newPassword"
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar nova senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Repita a nova senha"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-domux-burgundy-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link href="/auth/login" className="font-medium text-primary hover:text-domux-burgundy-dark">
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md py-12 px-4 text-center text-gray-500">Carregando...</div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
