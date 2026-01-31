"use client";

import { signIn } from "next-auth/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Máscaras (apenas dígitos para valor; formatação para exibição)
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

function formatDate(value: string): string {
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

function getPasswordStrength(password: string): { label: string; level: number } {
  if (!password) return { label: "Sem senha", level: 0 };
  let level = 0;
  if (password.length >= 6) level++;
  if (password.length >= 8) level++;
  if (/\d/.test(password)) level++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) level++;
  if (/[^A-Za-z0-9]/.test(password)) level++;
  const labels = ["Muito fraca", "Fraca", "Média", "Boa", "Forte"];
  return { label: labels[Math.min(level, 4)], level };
}

export default function RegisterPage() {
  const router = useRouter();
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [name, setName] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [genero, setGenero] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [aceiteTermos, setAceiteTermos] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);

  const passwordStrength = getPasswordStrength(password);

  // Rolagem para o início da página quando houver erro (para mostrar a mensagem abaixo da navbar)
  const scrollToTop = useCallback(() => {
    // Primeiro garantir que a janela está no topo
    window.scrollTo(0, 0);
    if (typeof document !== "undefined") {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    // Após o React renderizar o bloco de erro, levar o elemento de erro à vista
    // (o bloco de erro tem scroll-margin-top para ficar abaixo da navbar sticky)
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 100);
  }, []);

  useEffect(() => {
    if (error) scrollToTop();
  }, [error, scrollToTop]);

  const handleCpfCnpjChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCpfCnpj(formatCpfCnpj(e.target.value));
  }, []);

  const handleDataNascimentoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDataNascimento(formatDate(e.target.value));
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

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      setTimeout(scrollToTop, 80);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      setTimeout(scrollToTop, 80);
      return;
    }

    if (!aceiteTermos) {
      setError("Você precisa aceitar os Termos e Condições e as Políticas de Privacidade");
      setLoading(false);
      setTimeout(scrollToTop, 80);
      return;
    }

    const celularDigits = celular.replace(/\D/g, "");
    if (celularDigits.length < 10) {
      setError("Celular é obrigatório (informe DDD + número com 8 ou 9 dígitos)");
      setLoading(false);
      setTimeout(scrollToTop, 80);
      return;
    }

    const cpfCnpjDigits = cpfCnpj.replace(/\D/g, "");
    if (cpfCnpjDigits.length < 11) {
      setError("CPF/CNPJ inválido");
      setLoading(false);
      setTimeout(scrollToTop, 80);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cpfCnpj: cpfCnpjDigits,
          name: name.trim(),
          sobrenome: sobrenome.trim(),
          dataNascimento: dataNascimento || undefined,
          genero: genero || undefined,
          celular: celularDigits,
          email: email.trim(),
          password,
          aceiteTermos: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMsg = "Erro ao criar conta";
        if (data.details?.fieldErrors) {
          const msgs = Object.entries(data.details.fieldErrors)
            .map(([field, errs]: [string, unknown]) => {
              const nameMap: Record<string, string> = {
                cpfCnpj: "CPF/CNPJ",
                name: "Nome",
                sobrenome: "Sobrenome",
                email: "E-mail",
                password: "Senha",
                aceiteTermos: "Termos",
              };
              const text = Array.isArray(errs) ? errs.join(", ") : String(errs);
              return `${nameMap[field] || field}: ${text}`;
            })
            .join("; ");
          errorMsg = msgs || errorMsg;
        } else if (data.details?.message) {
          errorMsg = data.details.message;
        } else if (data.message) {
          errorMsg = data.message;
        } else if (data.error && data.error !== "Unprocessable Entity") {
          errorMsg = typeof data.error === "string" ? data.error : data.error.message || errorMsg;
        }
        setError(errorMsg);
        return;
      }

      setSuccess(true);
      setSuccessMessage(data.message || "Conta criada com sucesso!");

      setName("");
      setSobrenome("");
      setCpfCnpj("");
      setDataNascimento("");
      setGenero("");
      setCelular("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAceiteTermos(false);

      const userEmail = email.trim();
      const userPassword = password;

      setTimeout(async () => {
        try {
          const result = await signIn("credentials", {
            email: userEmail,
            password: userPassword,
            redirect: false,
          });
          if (result?.error) router.push("/auth/login");
          else {
            router.push("/");
            router.refresh();
          }
        } catch {
          router.push("/auth/login");
        }
      }, 2000);
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
      setTimeout(scrollToTop, 80);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="mx-auto max-w-md py-12 px-4">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">Criar Nova Conta</h1>

      {success ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mb-4 text-lg font-semibold text-green-800">{successMessage}</p>
          <p className="mb-6 text-sm text-green-700">Redirecionando automaticamente...</p>
          <Link
            href="/"
            className="inline-block w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-domux-burgundy-dark"
          >
            Ir para Página Inicial
          </Link>
        </div>
      ) : (
        <>
          {error && (
            <div
              ref={errorRef}
              className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 scroll-mt-28"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-8">
            {/* Informações Pessoais */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-900">Informações Pessoais</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="cpfCnpj" className={labelClass}>
                    CPF/CNPJ <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cpfCnpj"
                    type="text"
                    required
                    value={cpfCnpj}
                    onChange={handleCpfCnpjChange}
                    className={inputClass}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label htmlFor="name" className={labelClass}>
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label htmlFor="sobrenome" className={labelClass}>
                    Sobrenome <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="sobrenome"
                    type="text"
                    required
                    value={sobrenome}
                    onChange={handleSobrenomeChange}
                    className={inputClass}
                    placeholder="Seu sobrenome (apenas letras)"
                  />
                </div>
                <div>
                  <label htmlFor="dataNascimento" className={labelClass}>
                    Data de Nascimento
                  </label>
                  <input
                    id="dataNascimento"
                    type="text"
                    value={dataNascimento}
                    onChange={handleDataNascimentoChange}
                    className={inputClass}
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label htmlFor="genero" className={labelClass}>
                    Gênero
                  </label>
                  <select
                    id="genero"
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
                  <label htmlFor="celular" className={labelClass}>
                    Celular <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="celular"
                    type="text"
                    required
                    value={celular}
                    onChange={handleCelularChange}
                    className={inputClass}
                    placeholder="(00) 00000-0000"
                    maxLength={16}
                  />
                </div>
              </div>
            </section>

            {/* Informações de acesso */}
            <section>
              <h2 className="mb-4 text-lg font-bold text-gray-900">Informações de acesso</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className={labelClass}>
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="Informe seu email"
                  />
                </div>
                <div>
                  <label htmlFor="password" className={labelClass}>
                    Senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Informe uma senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.558 5.032m-6.006-1.881a3 3 0 10-4.243-4.243" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Força da senha: <span className="font-medium text-gray-700">{passwordStrength.label}</span>
                  </p>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>
                    Confirmar Senha <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Digite a senha novamente"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.558 5.032m-6.006-1.881a3 3 0 10-4.243-4.243" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    id="aceiteTermos"
                    type="checkbox"
                    checked={aceiteTermos}
                    onChange={(e) => setAceiteTermos(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
                  />
                  <label htmlFor="aceiteTermos" className="text-sm text-gray-700">
                    Li e concordo com os{" "}
                    <Link href="/termos" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline hover:text-domux-burgundy-dark">
                      Termos e Condições
                    </Link>{" "}
                    de uso deste site e suas{" "}
                    <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline hover:text-domux-burgundy-dark">
                      Políticas de Privacidade
                    </Link>
                  </label>
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-400 px-4 py-3 font-bold text-gray-900 hover:bg-amber-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Criando conta..." : "CRIAR CONTA"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-600">
            Ao continuar com o acesso, você concorda com a nossa{" "}
            <Link href="/privacidade" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline hover:text-domux-burgundy-dark">
              Política de privacidade
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-gray-600">
            Já tem conta?{" "}
            <Link href="/auth/login" className="font-medium text-primary hover:text-domux-burgundy-dark">
              Entrar
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
