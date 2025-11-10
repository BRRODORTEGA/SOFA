"use client";

import { useEffect, useState } from "react";

export default function ProdutoTecidosTab({ produtoId }: { produtoId: string }) {
  const [tecidos, setTecidos] = useState<any[]>([]);
  const [tecidosVinculados, setTecidosVinculados] = useState<any[]>([]);
  const [tecidoIds, setTecidoIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadTecidos();
    loadVinculados();
  }, [produtoId]);

  async function loadTecidos() {
    const res = await fetch("/api/tecidos");
    const data = await res.json();
    if (data.ok) setTecidos(data.data.items || []);
  }

  async function loadVinculados() {
    const res = await fetch(`/api/produtos/${produtoId}/tecidos`);
    const data = await res.json();
    if (data.ok) {
      setTecidosVinculados(data.data.tecidos || []);
      setTecidoIds(data.data.tecidoIds || []);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/produtos/${produtoId}/tecidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tecidoIds }),
    });
    if (res.ok) {
      setSaved(true);
      loadVinculados();
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Erro ao salvar");
    }
    setSaving(false);
  }

  async function handleRemove(tecidoId: string) {
    if (!confirm("Remover este tecido?")) return;
    const res = await fetch(`/api/produtos/${produtoId}/tecidos?tecidoId=${tecidoId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadVinculados();
    } else {
      alert("Erro ao remover");
    }
  }

  function toggleTecido(id: string) {
    setTecidoIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  const tecidosFiltrados = tecidos.filter(t => 
    t.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tecidos Vinculados</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-semibold text-green-600">Salvo ✓</span>}
          {saving && <span className="text-sm font-medium text-gray-500">Salvando...</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {saving ? "Salvando..." : "Salvar Seleção"}
          </button>
        </div>
      </div>

      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tecido..."
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {tecidosFiltrados.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-base text-gray-500">Nenhum tecido encontrado</p>
          </div>
        ) : (
          tecidosFiltrados.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={tecidoIds.includes(t.id)}
                  onChange={() => toggleTecido(t.id)}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-base font-semibold text-gray-900">{t.nome}</span>
                <span className={`rounded-lg px-3 py-1 text-sm font-bold ${
                  t.grade === "COURO" 
                    ? "bg-amber-100 text-amber-800 border border-amber-200" 
                    : "bg-blue-100 text-blue-800 border border-blue-200"
                }`}>
                  {t.grade}
                </span>
              </div>
              {tecidosVinculados.some(v => v.id === t.id) && (
                <button
                  onClick={() => handleRemove(t.id)}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Remover
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}




