"use client";

import Link from "next/link";

export default function MeusEnderecosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Endereços</h1>
        <p className="mt-1 text-gray-600">Gerencie seus endereços de cobrança e entrega.</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-gray-700">
          Em breve você poderá cadastrar e gerenciar seus endereços aqui.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Por enquanto, você pode atualizar seus dados em{" "}
          <Link href="/meus-dados/editar" className="font-medium text-primary hover:underline">
            Editar informações da conta
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
