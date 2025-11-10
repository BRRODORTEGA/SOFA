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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-base font-medium text-gray-500">Carregando variações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Variações</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-semibold text-green-600">Salvo ✓</span>}
          {saving && <span className="text-sm font-medium text-gray-500">Salvando...</span>}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            + Adicionar Variação
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            id="criar-variacoes"
            data-testid="criar-variacoes"
          >
            Criar variações
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Nova Variação</h3>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="number"
              placeholder="Medida (cm)"
              value={newVariacao.medida_cm}
              onChange={(e) => setNewVariacao({...newVariacao, medida_cm: e.target.value})}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Largura (cm)"
              value={newVariacao.largura_cm}
              onChange={(e) => setNewVariacao({...newVariacao, largura_cm: e.target.value})}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Profundidade (cm)"
              value={newVariacao.profundidade_cm}
              onChange={(e) => setNewVariacao({...newVariacao, profundidade_cm: e.target.value})}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Altura (cm)"
              value={newVariacao.altura_cm}
              onChange={(e) => setNewVariacao({...newVariacao, altura_cm: e.target.value})}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Metragem Tecido (m)"
              value={newVariacao.metragem_tecido_m}
              onChange={(e) => setNewVariacao({...newVariacao, metragem_tecido_m: e.target.value})}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Metragem Couro (m)"
              value={newVariacao.metragem_couro_m}
              onChange={(e) => setNewVariacao({...newVariacao, metragem_couro_m: e.target.value})}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={handleAdd} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">Adicionar</button>
            <button onClick={() => setShowAddForm(false)} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-base">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Medida (cm)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Largura (cm)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Profundidade (cm)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Altura (cm)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Met. Tecido (m)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Met. Couro (m)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {variacoes.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-base text-gray-500">Nenhuma variação cadastrada</td></tr>
            ) : (
              variacoes.map((v) => (
                <tr key={v.id} className="bg-white transition-colors hover:bg-blue-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{v.medida_cm}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={v.largura_cm}
                      onChange={(e) => handleFieldChange(v.medida_cm, "largura_cm", e.target.value)}
                      className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={v.profundidade_cm}
                      onChange={(e) => handleFieldChange(v.medida_cm, "profundidade_cm", e.target.value)}
                      className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={v.altura_cm}
                      onChange={(e) => handleFieldChange(v.medida_cm, "altura_cm", e.target.value)}
                      className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.1"
                      value={v.metragem_tecido_m}
                      onChange={(e) => handleFieldChange(v.medida_cm, "metragem_tecido_m", e.target.value)}
                      className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.1"
                      value={v.metragem_couro_m}
                      onChange={(e) => handleFieldChange(v.medida_cm, "metragem_couro_m", e.target.value)}
                      className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(v.medida_cm)}
                      className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
          <div className="rounded-lg border border-gray-200 bg-white p-6 max-w-md w-full shadow-xl">
            <h3 className="mb-6 text-xl font-bold text-gray-900">Criar Variações</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Medidas Fixas</label>
                <div className="flex flex-wrap gap-3">
                  {[80, 90, 100, 110, 120].map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={medidasFixas.includes(m)}
                        onChange={(e) => {
                          if (e.target.checked) setMedidasFixas([...medidasFixas, m]);
                          else setMedidasFixas(medidasFixas.filter(x => x !== m));
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{m}cm</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Medidas Personalizadas (separadas por vírgula)</label>
                <input
                  type="text"
                  value={medidasCustom}
                  onChange={(e) => setMedidasCustom(e.target.value)}
                  placeholder="ex: 95, 105, 125"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="usarPerfil"
                  checked={usarPerfilFamilia}
                  onChange={(e) => setUsarPerfilFamilia(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="usarPerfil" className="text-sm font-medium text-gray-700">Usar perfil da família</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="criarSkeleton"
                  checked={criarSkeletonPreco}
                  onChange={(e) => setCriarSkeletonPreco(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="criarSkeleton" className="text-sm font-medium text-gray-700">Criar skeleton de preços</label>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerate}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
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

