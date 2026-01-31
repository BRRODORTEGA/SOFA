"use client";

import { useEffect, useState } from "react";

type Ambiente = { id: string; nome: string };

interface Props {
  produtoId: string;
  ambientesIniciais: Ambiente[];
}

export default function ProdutoAmbientesTab({ produtoId, ambientesIniciais }: Props) {
  const [todosAmbientes, setTodosAmbientes] = useState<Ambiente[]>([]);
  const [selecionados, setSelecionados] = useState<string[]>(
    ambientesIniciais?.map((a) => a.id) ?? []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelecionados(ambientesIniciais?.map((a) => a.id) ?? []);
  }, [ambientesIniciais]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/ambientes?limit=200");
        const data = await res.json();
        if (data?.ok && data?.data?.items) {
          setTodosAmbientes(data.data.items);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggle = (ambienteId: string) => {
    setSelecionados((prev) =>
      prev.includes(ambienteId)
        ? prev.filter((id) => id !== ambienteId)
        : [...prev, ambienteId]
    );
    setSaved(false);
  };

  const selectAll = () => {
    setSelecionados(todosAmbientes.map((a) => a.id));
    setSaved(false);
  };

  const clearAll = () => {
    setSelecionados([]);
    setSaved(false);
  };

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/produtos/${produtoId}/ambientes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ambienteIds: selecionados }),
      });
      const data = await res.json();
      if (res.ok && data?.ok !== false) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(data?.error || data?.details?.message || "Erro ao salvar.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <p className="text-gray-500">Carregando ambientes…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-2 text-lg font-semibold text-gray-900">Ambientes em que este produto se encaixa</h3>
      <p className="mb-4 text-sm text-gray-600">
        Marque os ambientes em que este produto pode ser exibido. Um produto pode pertencer a vários ambientes (ex.: Sala de Estar e Escritório).
      </p>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Marcar todos
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Desmarcar todos
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {todosAmbientes.map((amb) => {
          const checked = selecionados.includes(amb.id);
          return (
            <label
              key={amb.id}
              className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                checked ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(amb.id)}
                className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-900">{amb.nome}</span>
            </label>
          );
        })}
      </div>

      {todosAmbientes.length === 0 && (
        <p className="mb-4 text-sm text-gray-500">Nenhum ambiente cadastrado. Cadastre ambientes em Ambiente → Lista de Ambientes.</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar ambientes"}
        </button>
        {saved && <span className="text-sm text-green-600">Salvo.</span>}
        {selecionados.length > 0 && (
          <span className="text-sm text-gray-500">
            {selecionados.length} ambiente(s) selecionado(s)
          </span>
        )}
      </div>
    </div>
  );
}
