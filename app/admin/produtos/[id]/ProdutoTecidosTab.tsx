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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tecidos Vinculados</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Salvo ✓</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-60"
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
          className="w-full rounded border p-2"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
        {tecidosFiltrados.map((t) => (
          <div key={t.id} className="flex items-center justify-between rounded border p-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tecidoIds.includes(t.id)}
                onChange={() => toggleTecido(t.id)}
              />
              <span>{t.nome}</span>
              <span className={`rounded px-2 py-0.5 text-xs ${
                t.grade === "COURO" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
              }`}>
                {t.grade}
              </span>
            </div>
            {tecidosVinculados.some(v => v.id === t.id) && (
              <button
                onClick={() => handleRemove(t.id)}
                className="rounded border px-2 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Remover
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}




