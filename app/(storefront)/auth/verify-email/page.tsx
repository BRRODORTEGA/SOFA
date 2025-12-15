"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificação não fornecido.");
      return;
    }

    async function verifyEmail() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok && data.ok) {
          setStatus("success");
          setMessage("E-mail confirmado com sucesso! Sua conta está ativa.");
          // Redirecionar para login após 3 segundos
          setTimeout(() => {
            router.push("/auth/login?message=email_verified");
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.error || data.message || "Erro ao verificar e-mail. Token inválido ou expirado.");
        }
      } catch (error) {
        console.error("Erro ao verificar email:", error);
        setStatus("error");
        setMessage("Erro ao verificar e-mail. Tente novamente mais tarde.");
      }
    }

    verifyEmail();
  }, [token, router]);

  return (
    <div className="mx-auto max-w-md py-12 px-4">
      <h1 className="mb-6 text-center text-3xl font-bold text-gray-900">Verificação de E-mail</h1>

      {status === "loading" && (
        <div className="rounded-lg border border-blue-300 bg-blue-50 p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-blue-800">Verificando seu e-mail...</p>
        </div>
      )}

      {status === "success" && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mb-4 text-lg font-semibold text-green-800">{message}</p>
          <p className="text-sm text-green-700">Redirecionando para a página de login...</p>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="mb-4 text-lg font-semibold text-red-800">{message}</p>
          <div className="mt-6 space-y-3">
            <Link
              href="/auth/login"
              className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Ir para Login
            </Link>
            <br />
            <Link
              href="/auth/register"
              className="inline-block text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Criar nova conta
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}



