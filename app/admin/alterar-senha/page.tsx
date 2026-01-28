"use client";

import { useState } from "react";

export default function AlterarSenhaAdminPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!senhaAtual) {
      setError("Informe a senha atual");
      setLoading(false);
      return;
    }
    if (novaSenha.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setError("A nova senha e a confirmação não coincidem");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/alterar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senhaAtual,
          novaSenha,
          confirmarNovaSenha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao alterar senha");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Alterar senha do admin</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Senha alterada com sucesso.
          </div>
        )}

        <div>
          <label htmlFor="senhaAtual" className="mb-1 block text-sm font-medium text-gray-700">
            Senha atual
          </label>
          <input
            id="senhaAtual"
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite sua senha atual"
            autoComplete="current-password"
          />
        </div>

        <div>
          <label htmlFor="novaSenha" className="mb-1 block text-sm font-medium text-gray-700">
            Nova senha
          </label>
          <input
            id="novaSenha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </div>

        <div>
          <label htmlFor="confirmarNovaSenha" className="mb-1 block text-sm font-medium text-gray-700">
            Confirmar nova senha
          </label>
          <input
            id="confirmarNovaSenha"
            type="password"
            value={confirmarNovaSenha}
            onChange={(e) => setConfirmarNovaSenha(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Repita a nova senha"
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Alterando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
