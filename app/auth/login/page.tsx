"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@local");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/admin",
    });
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-4 text-xl font-semibold">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border p-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="E-mail" />
        <input className="w-full rounded border p-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Senha" />
        <button className="rounded bg-black px-4 py-2 text-white disabled:opacity-60" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-3 text-sm text-gray-500">Fase 3: autenticação mock. Integração real virá na Fase 6.</p>
      <p className="mt-4 text-xs text-gray-500">
        Logins de teste (mock):<br/>
        <b>ADMIN:</b> admin@local / admin<br/>
        <b>OPERADOR:</b> op@local / op<br/>
        <b>FABRICA:</b> fab@local / fab<br/>
        <b>CLIENTE:</b> cli@local / cli
      </p>
    </div>
  );
}

