"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      
      // Log para depuração
      if (!res.ok) {
        console.error("Erro no registro:", data);
      }

      if (!res.ok) {
        // Tratar diferentes formatos de erro
        let errorMsg = "Erro ao criar conta";
        
        // Verificar se há detalhes de validação
        if (data.details) {
          if (data.details.fieldErrors) {
            // Erro de validação do Zod
            const fieldErrors = Object.entries(data.details.fieldErrors)
              .map(([field, errors]) => {
                const fieldName = field === "name" ? "Nome" : field === "email" ? "E-mail" : field === "password" ? "Senha" : field;
                const errorText = Array.isArray(errors) ? errors.join(', ') : errors;
                return `${fieldName}: ${errorText}`;
              })
              .join('; ');
            errorMsg = `Erro de validação: ${fieldErrors}`;
          } else if (data.details.message) {
            errorMsg = data.details.message;
          } else if (typeof data.details === 'string') {
            errorMsg = data.details;
          }
        } else if (data.error) {
          if (typeof data.error === 'string') {
            errorMsg = data.error;
          } else if (data.error.message) {
            errorMsg = data.error.message;
          }
        }
        
        setError(errorMsg);
        return;
      }

      // Salvar email e senha temporariamente para login automático
      const userEmail = email;
      const userPassword = password;
      
      // Mostrar mensagem de sucesso
      setSuccess(true);
      setSuccessMessage(data.message || "Conta criada com sucesso!");
      
      // Limpar formulário
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      
      // Fazer login automático após registro
      setTimeout(async () => {
        try {
          const result = await signIn("credentials", {
            email: userEmail,
            password: userPassword,
            redirect: false,
          });

          if (result?.error) {
            // Se não conseguir fazer login automático, redirecionar para login
            router.push("/auth/login");
          } else {
            // Login bem-sucedido, redirecionar para home
            router.push("/");
            router.refresh();
          }
        } catch (err) {
          // Em caso de erro, redirecionar para login
          router.push("/auth/login");
        }
      }, 2000);
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-12 px-4">
      <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Criar Conta</h1>

      {success ? (
        <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mb-4 text-lg font-semibold text-green-800">{successMessage}</p>
          <p className="mb-6 text-sm text-green-700">
            Redirecionando automaticamente...
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-block w-full rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-domux-burgundy-dark"
            >
              Ir para Página Inicial
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
              className="text-sm text-primary hover:text-domux-burgundy-dark hover:underline"
            >
              Criar outra conta
            </button>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Seu nome"
          />
        </div>

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
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar Senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Digite a senha novamente"
          />
        </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-domux-burgundy-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
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

