"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sair
    </button>
  );
}




