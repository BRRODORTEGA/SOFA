"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
      [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
    );
  }
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
    (_, a, b, c, d, e) => `${a}.${b}.${c}/${d}` + (e ? `-${e}` : "")
  );
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatCelular(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Nome e Sobrenome: apenas letras e espaço, em maiúsculas (sem caracteres especiais). */
function formatNomeSobrenome(value: string): string {
  return value
    .replace(/[^\p{L}\s]/gu, "")
    .toUpperCase();
}

function dateToDDMMAAAA(d: Date | null | undefined): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatCpfCnpjFromStorage(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) =>
      [a, b, c].filter(Boolean).join(".") + (d ? `-${d}` : "")
    );
  }
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,
    (_, a, b, c, d, e) => `${a}.${b}.${c}/${d}` + (e ? `-${e}` : "")
  );
}

function formatCelularFromStorage(value: string | null | undefined): string {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

type UserMe = {
  id: string;
  name: string | null;
  sobrenome: string | null;
  cpfCnpj: string | null;
  dataNascimento: string | null;
  genero: string | null;
  celular: string | null;
  email: string;
};

export default function EditarInformacoesPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [cpfCnpj, setCpfCnpj] = useState("");
  const [name, setName] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [genero, setGenero] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleCpfCnpjChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCpfCnpj(formatCpfCnpj(e.target.value));
  }, []);

  const handleDataNascimentoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDataNascimento(formatDateInput(e.target.value));
  }, []);

  const handleCelularChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(formatCelular(e.target.value));
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(formatNomeSobrenome(e.target.value));
  }, []);

  const handleSobrenomeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSobrenome(formatNomeSobrenome(e.target.value));
  }, []);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch("/api/user/me")
      .then((r) => r.json())
      .then((data: UserMe & { dataNascimento?: Date | string | null }) => {
        if (data.id) {
          setName(formatNomeSobrenome(data.name || ""));
          setSobrenome(formatNomeSobrenome(data.sobrenome || ""));
          setCpfCnpj(formatCpfCnpjFromStorage(data.cpfCnpj));
          setDataNascimento(
            data.dataNascimento
              ? dateToDDMMAAAA(
                  typeof data.dataNascimento === "string"
                    ? new Date(data.dataNascimento)
                    : data.dataNascimento
                )
              : ""
          );
          setGenero(data.genero || "");
          setCelular(formatCelularFromStorage(data.celular));
          setEmail(data.email || "");
        }
      })
      .catch(() => setError("Erro ao carregar dados"))
      .finally(() => setLoading(false));
  }, [session?.user?.email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    if (!name.trim() || name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      setSaving(false);
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("E-mail inválido");
      setSaving(false);
      return;
    }
    if (password) {
      if (password.length < 6) {
        setError("Senha deve ter pelo menos 6 caracteres");
        setSaving(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem");
        setSaving(false);
        return;
      }
    }

    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        sobrenome: sobrenome.trim() || undefined,
        cpfCnpj: cpfCnpj.replace(/\D/g, "").trim() || undefined,
        dataNascimento: dataNascimento || undefined,
        genero: genero.trim() || undefined,
        celular: celular.replace(/\D/g, "").trim() || undefined,
        email: email.toLowerCase().trim(),
      };
      if (password) body.password = password;

      const res = await fetch("/api/user/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.details?.message || data.error || data.message || "Erro ao atualizar dados");
        setSaving(false);
        return;
      }

      await update();
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar dados");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";
  const labelClass = "block text-sm font-medium text-gray-700";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar informações da conta</h1>
        <p className="mt-1 text-gray-600">Atualize seus dados cadastrais.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">Dados atualizados com sucesso!</p>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        <h2 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-900">
          Informações de Conta
        </h2>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>CPF/CNPJ *</label>
            <input
              type="text"
              value={cpfCnpj}
              onChange={handleCpfCnpjChange}
              className={inputClass}
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <label className={labelClass}>Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Seu nome"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Sobrenome *</label>
            <input
              type="text"
              value={sobrenome}
              onChange={handleSobrenomeChange}
              className={inputClass}
              placeholder="Seu sobrenome (apenas letras)"
            />
          </div>
          <div>
            <label className={labelClass}>Data de Nascimento</label>
            <input
              type="text"
              value={dataNascimento}
              onChange={handleDataNascimentoChange}
              className={inputClass}
              placeholder="DD/MM/AAAA"
              maxLength={10}
            />
          </div>
          <div>
            <label className={labelClass}>Gênero</label>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione...</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro</option>
              <option value="Prefiro não informar">Prefiro não informar</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Celular *</label>
            <input
              type="text"
              value={celular}
              onChange={handleCelularChange}
              className={inputClass}
              placeholder="(00) 00000-0000"
              maxLength={16}
            />
          </div>
          <div>
            <label className={labelClass}>E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="seu@email.com"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Se você alterar o e-mail, precisará fazer login novamente.
            </p>
          </div>
        </div>

        <div id="senha" className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">Alterar Senha</h2>
          <p className="mb-4 text-sm text-gray-600">
            Deixe em branco se não desejar alterar a senha.
          </p>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nova Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className={labelClass}>Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Digite a senha novamente"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-domux-burgundy-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
          <Link
            href="/meus-dados"
            className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
