"use client";

import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">Room2Go</Link>
        <nav className="flex items-center gap-4">
          <Link href="/admin" className="text-sm hover:underline">Admin</Link>
          <Link href="/auth/login" className="text-sm hover:underline">Entrar</Link>
        </nav>
      </div>
    </header>
  );
}




