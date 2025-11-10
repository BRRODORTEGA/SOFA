"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type Variacao = {
  id: string;
  medida_cm: number;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  metragem_tecido_m: number;
  metragem_couro_m: number;
};

export default function ProdutoVariacoesTab({ produtoId }: { produtoId: string }) {
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [medidasFixas, setMedidasFixas] = useState<number[]>([80, 90, 100, 110, 120]);
  const [medidasCustom, setMedidasCustom] = useState<string>("");
  const [usarPerfilFamilia, setUsarPerfilFamilia] = useState(true);
  const [criarSkeletonPreco, setCriarSkeletonPreco] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVariacao, setNewVariacao] = useState({
    medida_cm: "",
    largura_cm: "",
    profundidade_cm: "",
    altura_cm: "",
    metragem_tecido_m: "",
    metragem_couro_m: "",
  });
  const debounceRef = useRef<NodeJS.Timeout>();
  const changedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    loadVariacoes();
  }, [produtoId]);

  async function loadVariacoes() {
    setLoading(true);
    const res = await fetch(`/api/produtos/${produtoId}/variacoes`);
    const data = await res.json();
    if (data.ok) setVariacoes(data.data.items || []);
    setLoading(false);
  }

  async function saveChanges() {
    if (changedRef.current.size === 0) return;
    setSaving(true);
    const toSave = variacoes.filter(v => changedRef.current.has(v.medida_cm));
    const res = await fetch(`/api/produtos/${produtoId}/variacoes`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    });
    if (res.ok) {
      setSaved(true);
      changedRef.current.clear();
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Erro ao salvar");
    }
    setSaving(false);
  }

  function handleFieldChange(medida: number, field: keyof Variacao, value: string) {
    setVariacoes(prev => prev.map(v => 
      v.medida_cm === medida ? { ...v, [field]: Number(value) } : v
    ));
    changedRef.current.add(medida);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveChanges(), 500);
  }

  async function handleAdd() {
    const res = await fetch(`/api/produtos/${produtoId}/variacoes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medida_cm: Number(newVariacao.medida_cm),
        largura_cm: Number(newVariacao.largura_cm),
        profundidade_cm: Number(newVariacao.profundidade_cm),
        altura_cm: Number(newVariacao.altura_cm),
        metragem_tecido_m: Number(newVariacao.metragem_tecido_m),
        metragem_couro_m: Number(newVariacao.metragem_couro_m),
      }),
    });
    if (res.ok) {
      setShowAddForm(false);
      setNewVariacao({
        medida_cm: "", largura_cm: "", profundidade_cm: "", altura_cm: "",
        metragem_tecido_m: "", metragem_couro_m: "",
      });
      loadVariacoes();
    } else {
      const data = await res.json();
      alert(data.error?.message || "Erro ao criar variação");
    }
  }

  async function handleDelete(medida: number) {
    if (!confirm(`Excluir variação de ${medida}cm?`)) return;
    const res = await fetch(`/api/produtos/${produtoId}/variacoes?medida=${medida}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadVariacoes();
    } else {
      alert("Erro ao excluir");
    }
  }

  async function handleGenerate() {
    const custom = medidasCustom.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    const res = await fetch(`/api/produtos/${produtoId}/variacoes/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medidasFixas,
        medidasCustom: custom,
        usarPerfilFamilia,
        criarSkeletonPreco,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setShowModal(false);
      if (data.data.created === 0) {
        alert("Todas as medidas já existem");
      }
      loadVariacoes();
    } else {
      alert("Erro ao gerar variações");
    }
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Variações</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-green-600">Salvo ✓</span>}
          {saving && <span className="text-sm text-gray-500">Salvando...</span>}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded border px-3 py-2 text-sm"
          >
            + Adicionar Variação
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
            id="criar-variacoes"
            data-testid="criar-variacoes"
          >
            Criar variações
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="rounded border bg-gray-50 p-4">
          <h3 className="mb-2 font-medium">Nova Variação</h3>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              placeholder="Medida (cm)"
              value={newVariacao.medida_cm}
              onChange={(e) => setNewVariacao({...newVariacao, medida_cm: e.target.value})}
              className="rounded border p-2"
            />
            <input
              type="number"
              placeholder="Largura (cm)"
              value={newVariacao.largura_cm}
              onChange={(e) => setNewVariacao({...newVariacao, largura_cm: e.target.value})}
              className="rounded border p-2"
            />
            <input
              type="number"
              placeholder="Profundidade (cm)"
              value={newVariacao.profundidade_cm}
              onChange={(e) => setNewVariacao({...newVariacao, profundidade_cm: e.target.value})}
              className="rounded border p-2"
            />
            <input
              type="number"
              placeholder="Altura (cm)"
              value={newVariacao.altura_cm}
              onChange={(e) => setNewVariacao({...newVariacao, altura_cm: e.target.value})}
              className="rounded border p-2"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Metragem Tecido (m)"
              value={newVariacao.metragem_tecido_m}
              onChange={(e) => setNewVariacao({...newVariacao, metragem_tecido_m: e.target.value})}
              className="rounded border p-2"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Metragem Couro (m)"
              value={newVariacao.metragem_couro_m}
              onChange={(e) => setNewVariacao({...newVariacao, metragem_couro_m: e.target.value})}
              className="rounded border p-2"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={handleAdd} className="rounded bg-black px-3 py-1 text-sm text-white">Adicionar</button>
            <button onClick={() => setShowAddForm(false)} className="rounded border px-3 py-1 text-sm">Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left">Medida (cm)</th>
              <th className="px-3 py-2 text-left">Largura (cm)</th>
              <th className="px-3 py-2 text-left">Profundidade (cm)</th>
              <th className="px-3 py-2 text-left">Altura (cm)</th>
              <th className="px-3 py-2 text-left">Met. Tecido (m)</th>
              <th className="px-3 py-2 text-left">Met. Couro (m)</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {variacoes.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-500">Nenhuma variação cadastrada</td></tr>
            ) : (
              variacoes.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-2 font-medium">{v.medida_cm}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={v.largura_cm}
                      onChange={(e) => handleFieldChange(v.medida_cm, "largura_cm", e.target.value)}
                      className="w-20 rounded border p-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={v.profundidade_cm}
                      onChange={(e) => handleFieldChange(v.medida_cm, "profundidade_cm", e.target.value)}
                      className="w-20 rounded border p-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={v.altura_cm}
                      onChange={(e) => handleFieldChange(v.medida_cm, "altura_cm", e.target.value)}
                      className="w-20 rounded border p-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      value={v.metragem_tecido_m}
                      onChange={(e) => handleFieldChange(v.medida_cm, "metragem_tecido_m", e.target.value)}
                      className="w-24 rounded border p-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.1"
                      value={v.metragem_couro_m}
                      onChange={(e) => handleFieldChange(v.medida_cm, "metragem_couro_m", e.target.value)}
                      className="w-24 rounded border p-1"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleDelete(v.medida_cm)}
                      className="rounded border px-2 py-1 text-sm text-red-600"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded bg-white p-6 max-w-md w-full">
            <h3 className="mb-4 text-lg font-semibold">Criar Variações</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Medidas Fixas</label>
                <div className="flex flex-wrap gap-2">
                  {[80, 90, 100, 110, 120].map(m => (
                    <label key={m} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={medidasFixas.includes(m)}
                        onChange={(e) => {
                          if (e.target.checked) setMedidasFixas([...medidasFixas, m]);
                          else setMedidasFixas(medidasFixas.filter(x => x !== m));
                        }}
                      />
                      <span>{m}cm</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Medidas Personalizadas (separadas por vírgula)</label>
                <input
                  type="text"
                  value={medidasCustom}
                  onChange={(e) => setMedidasCustom(e.target.value)}
                  placeholder="ex: 95, 105, 125"
                  className="w-full rounded border p-2"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="usarPerfil"
                  checked={usarPerfilFamilia}
                  onChange={(e) => setUsarPerfilFamilia(e.target.checked)}
                />
                <label htmlFor="usarPerfil" className="text-sm">Usar perfil da família</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="criarSkeleton"
                  checked={criarSkeletonPreco}
                  onChange={(e) => setCriarSkeletonPreco(e.target.checked)}
                />
                <label htmlFor="criarSkeleton" className="text-sm">Criar skeleton de preços</label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded border px-3 py-2 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerate}
                  className="rounded bg-blue-600 px-3 py-2 text-sm text-white"
                >
                  Gerar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

