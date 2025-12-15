"use client";

import { useState } from "react";

interface ClienteRepresentanteToggleProps {
  clienteId: string;
  representante: boolean;
  onUpdate?: () => void;
}

export function ClienteRepresentanteToggle({ clienteId, representante: initialRepresentante, onUpdate }: ClienteRepresentanteToggleProps) {
  const [representante, setRepresentante] = useState(initialRepresentante);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/clientes/${clienteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ representante: newValue }),
      });

      const result = await res.json();

      if (res.ok && result.ok) {
        setRepresentante(newValue);
        if (onUpdate) {
          onUpdate();
        }
      } else {
        // Reverter em caso de erro
        setRepresentante(!newValue);
        const errorMsg = result.message || result.error || "Erro ao atualizar";
        alert(`Erro ao atualizar: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao atualizar representante:", error);
      // Reverter em caso de erro
      setRepresentante(!newValue);
      alert("Erro ao atualizar. Verifique o console para mais detalhes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        id="representante"
        checked={representante}
        onChange={handleToggle}
        disabled={loading}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <label htmlFor="representante" className="text-sm font-medium text-gray-700">
        Representante / Lojista
      </label>
      {loading && (
        <span className="text-xs text-gray-500">Salvando...</span>
      )}
    </div>
  );
}


