"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data?.details?.message ?? data?.message ?? data?.error ?? "Erro ao enviar. Tente novamente.";
        setError(typeof msg === "string" ? msg : "E-mail inválido.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md py-12 px-4">
        <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Redefinir senha</h1>
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">
            Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
            Verifique sua caixa de entrada e a pasta de spam.
          </p>
        </div>
        <p className="text-center text-sm text-gray-600">
          <Link href="/auth/login" className="font-medium text-primary hover:text-domux-burgundy-dark">
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-12 px-4">
      <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Esqueci minha senha</h1>
      <p className="mb-4 text-center text-sm text-gray-600">
        Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="seu@email.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-domux-burgundy-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Enviando..." : "Enviar link"}
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
