"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-red-50 hover:border-red-300 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
      onClick={() => signOut({ callbackUrl: "https://domuxdesign.com.br" })}
    >
      Sair
    </button>
  );
}




