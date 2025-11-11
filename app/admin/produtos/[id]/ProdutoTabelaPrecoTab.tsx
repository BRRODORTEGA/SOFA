"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import { debounce } from "lodash";

type LinhaPreco = {
  id?: string;
  categoriaNome?: string;
  familiaNome?: string;
  produtoNome?: string;
  medida_cm: number;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  largura_assento_cm: number;
  altura_assento_cm: number;
  largura_braco_cm: number;
  metragem_tecido_m: number;
  metragem_couro_m: number;
  preco_grade_1000: number;
  preco_grade_2000: number;
  preco_grade_3000: number;
  preco_grade_4000: number;
  preco_grade_5000: number;
  preco_grade_6000: number;
  preco_grade_7000: number;
  preco_couro: number;
};

export default function ProdutoTabelaPrecoTab({ produtoId }: { produtoId: string }) {
  const [linhas, setLinhas] = useState<LinhaPreco[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [variacoesFaltantes, setVariacoesFaltantes] = useState<any[]>([]);
  const [selectedMedidas, setSelectedMedidas] = useState<Set<number>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const dirtyRef = useRef<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLinhas();
  }, [produtoId]);

  async function loadLinhas() {
    setLoading(true);
    try {
      const res = await fetch(`/api/produtos/${produtoId}/tabela-preco`);
      const data = await res.json();
      if (data.ok) {
        // Converter Decimal para number
        const items = (data.data.items || []).map((item: any) => ({
          ...item,
          preco_grade_1000: Number(item.preco_grade_1000 || 0),
          preco_grade_2000: Number(item.preco_grade_2000 || 0),
          preco_grade_3000: Number(item.preco_grade_3000 || 0),
          preco_grade_4000: Number(item.preco_grade_4000 || 0),
          preco_grade_5000: Number(item.preco_grade_5000 || 0),
          preco_grade_6000: Number(item.preco_grade_6000 || 0),
          preco_grade_7000: Number(item.preco_grade_7000 || 0),
          preco_couro: Number(item.preco_couro || 0),
        }));
        setLinhas(items);
      }
    } catch (e) {
      setError("Erro ao carregar dados");
    }
    setLoading(false);
  }

  const saveChanges = useCallback(
    debounce(async (rows: LinhaPreco[]) => {
      if (rows.length === 0) return;
      setSaving(true);
      setSaved(false);
      setError(null);
      try {
        const res = await fetch(`/api/produtos/${produtoId}/tabela-preco`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rows),
        });
        if (res.ok) {
          setSaved(true);
          dirtyRef.current.clear();
          setTimeout(() => setSaved(false), 3000);
        } else {
          const data = await res.json();
          setError(data.error || "Erro ao salvar");
        }
      } catch (e) {
        setError("Erro ao salvar");
      }
      setSaving(false);
    }, 500),
    [produtoId]
  );

  function onChange(medida: number, field: keyof LinhaPreco, value: string) {
    const numValue = field === "medida_cm" || field.includes("_cm") 
      ? Math.max(0, Math.floor(Number(value) || 0))
      : Math.max(0, Number(value) || 0);
    
    setLinhas((prev) =>
      prev.map((l) => (l.medida_cm === medida ? { ...l, [field]: numValue } : l))
    );
    dirtyRef.current.add(medida);
    
    // Envia todas as linhas modificadas
    const toSave = linhas
      .map((l) => (l.medida_cm === medida ? { ...l, [field]: numValue } : l))
      .filter((l) => dirtyRef.current.has(l.medida_cm));
    saveChanges(toSave);
  }

  async function addLinha() {
    const medida = window.prompt("Informe a nova medida (cm):");
    if (!medida) return;
    const n = Number(medida);
    if (isNaN(n) || n <= 0) {
      alert("Medida inválida. Informe um número maior que zero.");
      return;
    }
    if (linhas.some((l) => l.medida_cm === n)) {
      alert("Já existe uma linha com esta medida. Escolha outra medida.");
      return;
    }

    const nova: LinhaPreco = {
      medida_cm: n,
      largura_cm: 0,
      profundidade_cm: 0,
      altura_cm: 0,
      largura_assento_cm: 0,
      altura_assento_cm: 0,
      largura_braco_cm: 0,
      metragem_tecido_m: 0,
      metragem_couro_m: 0,
      preco_grade_1000: 0,
      preco_grade_2000: 0,
      preco_grade_3000: 0,
      preco_grade_4000: 0,
      preco_grade_5000: 0,
      preco_grade_6000: 0,
      preco_grade_7000: 0,
      preco_couro: 0,
    };

    setLinhas([...linhas, nova].sort((a, b) => a.medida_cm - b.medida_cm));
    dirtyRef.current.add(n);
    saveChanges([nova]);
  }

  async function deleteLinha(medida: number) {
    if (!confirm(`Excluir linha de ${medida}cm?`)) return;
    const res = await fetch(`/api/produtos/${produtoId}/tabela-preco?medida=${medida}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setLinhas(linhas.filter((l) => l.medida_cm !== medida));
      dirtyRef.current.delete(medida);
    } else {
      alert("Erro ao excluir");
    }
  }

  function onImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const data = results.data.map((row: any) => ({
            medida_cm: Number(row.medida_cm || row["Medida (cm)"] || 0),
            largura_cm: Number(row.largura_cm || row["Largura (cm)"] || 0),
            profundidade_cm: Number(row.profundidade_cm || row["Profundidade (cm)"] || 0),
            altura_cm: Number(row.altura_cm || row["Altura (cm)"] || 0),
            largura_assento_cm: Number(row.largura_assento_cm || row["Larg. Assento (cm)"] || row["Largura Assento (cm)"] || 0),
            altura_assento_cm: Number(row.altura_assento_cm || row["Alt. Assento (cm)"] || row["Altura Assento (cm)"] || 0),
            largura_braco_cm: Number(row.largura_braco_cm || row["Larg. Braço (cm)"] || row["Largura Braço (cm)"] || 0),
            metragem_tecido_m: Number(row.metragem_tecido_m || row["Metragem Tecido (m)"] || row["Met. Tecido (m)"] || 0),
            metragem_couro_m: Number(row.metragem_couro_m || row["Metragem Couro (m)"] || row["Met. Couro (m)"] || 0),
            preco_grade_1000: Number(row.preco_grade_1000 || row["1000"] || row["G1000"] || 0),
            preco_grade_2000: Number(row.preco_grade_2000 || row["2000"] || row["G2000"] || 0),
            preco_grade_3000: Number(row.preco_grade_3000 || row["3000"] || row["G3000"] || 0),
            preco_grade_4000: Number(row.preco_grade_4000 || row["4000"] || row["G4000"] || 0),
            preco_grade_5000: Number(row.preco_grade_5000 || row["5000"] || row["G5000"] || 0),
            preco_grade_6000: Number(row.preco_grade_6000 || row["6000"] || row["G6000"] || 0),
            preco_grade_7000: Number(row.preco_grade_7000 || row["7000"] || row["G7000"] || 0),
            preco_couro: Number(row.preco_couro || row["Couro"] || 0),
          }));

          const res = await fetch(`/api/produtos/${produtoId}/tabela-preco`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (res.ok) {
            loadLinhas();
            alert("CSV importado com sucesso");
          } else {
            alert("Erro ao importar CSV");
          }
        } catch (e) {
          alert("Erro ao processar CSV");
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (error) => {
        alert(`Erro ao ler CSV: ${error.message}`);
      },
    });
  }

  async function checkVariacoesFaltantes() {
    try {
      const res = await fetch(`/api/produtos/${produtoId}/tabela-preco/sync`);
      const data = await res.json();
      
      if (data.ok) {
        const faltantes = data.data.faltantes || [];
        if (faltantes.length === 0) {
          alert("Todas as variações já estão contempladas na tabela de preço.");
          return;
        }
        
        setVariacoesFaltantes(faltantes);
        setSelectedMedidas(new Set(faltantes.map((v: any) => v.medida_cm)));
        setShowSyncModal(true);
      } else {
        alert("Erro ao verificar variações faltantes");
      }
    } catch (e) {
      alert("Erro ao verificar variações faltantes");
    }
  }

  async function syncSkeleton() {
    if (selectedMedidas.size === 0) {
      alert("Selecione pelo menos uma variação para incluir");
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch(`/api/produtos/${produtoId}/tabela-preco/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medidas: Array.from(selectedMedidas) }),
      });

      const data = await res.json();
      
      if (res.ok && data.ok) {
        alert(`${data.data.created} linha(s) de preço criada(s) com sucesso!`);
        setShowSyncModal(false);
        setSelectedMedidas(new Set());
        setVariacoesFaltantes([]);
        loadLinhas(); // Recarrega a tabela
      } else {
        alert("Erro ao criar skeleton de preços");
      }
    } catch (e) {
      alert("Erro ao criar skeleton de preços");
    } finally {
      setSyncing(false);
    }
  }

  function toggleMedida(medida: number) {
    setSelectedMedidas((prev) => {
      const next = new Set(prev);
      if (next.has(medida)) {
        next.delete(medida);
      } else {
        next.add(medida);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedMedidas.size === variacoesFaltantes.length) {
      setSelectedMedidas(new Set());
    } else {
      setSelectedMedidas(new Set(variacoesFaltantes.map((v: any) => v.medida_cm)));
    }
  }

  function onExportCsv() {
    const headers = [
      "Categoria",
      "Família",
      "Nome Produto",
      "Medida (cm)",
      "Largura (cm)",
      "Profundidade (cm)",
      "Altura (cm)",
      "Larg. Assento (cm)",
      "Alt. Assento (cm)",
      "Larg. Braço (cm)",
      "Met. Tecido (m)",
      "Met. Couro (m)",
      "1000",
      "2000",
      "3000",
      "4000",
      "5000",
      "6000",
      "7000",
      "Couro",
    ];

    const csvData = linhas.map((l) => [
      l.categoriaNome || "",
      l.familiaNome || "",
      l.produtoNome || "",
      l.medida_cm,
      l.largura_cm,
      l.profundidade_cm,
      l.altura_cm,
      l.largura_assento_cm || 0,
      l.altura_assento_cm || 0,
      l.largura_braco_cm || 0,
      l.metragem_tecido_m,
      l.metragem_couro_m,
      l.preco_grade_1000,
      l.preco_grade_2000,
      l.preco_grade_3000,
      l.preco_grade_4000,
      l.preco_grade_5000,
      l.preco_grade_6000,
      l.preco_grade_7000,
      l.preco_couro,
    ]);

    const csv = Papa.unparse({
      fields: headers,
      data: csvData,
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `produto_${produtoId}_tabela.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-base font-medium text-gray-500">Carregando tabela de preço...</div>
      </div>
    );
  }

  const columns = [
    { key: "categoriaNome", label: "Categoria", readonly: true, isText: true },
    { key: "familiaNome", label: "Família", readonly: true, isText: true },
    { key: "produtoNome", label: "Nome Produto", readonly: true, isText: true },
    { key: "medida_cm", label: "Medida (cm)", readonly: true },
    { key: "largura_cm", label: "Largura (cm)", readonly: false },
    { key: "profundidade_cm", label: "Profundidade (cm)", readonly: false },
    { key: "altura_cm", label: "Altura (cm)", readonly: false },
    { key: "largura_assento_cm", label: "Larg. Assento (cm)", readonly: false },
    { key: "altura_assento_cm", label: "Alt. Assento (cm)", readonly: false },
    { key: "largura_braco_cm", label: "Larg. Braço (cm)", readonly: false },
    { key: "metragem_tecido_m", label: "Met. Tecido (m)", readonly: false },
    { key: "metragem_couro_m", label: "Met. Couro (m)", readonly: false },
    { key: "preco_grade_1000", label: "1000", readonly: false },
    { key: "preco_grade_2000", label: "2000", readonly: false },
    { key: "preco_grade_3000", label: "3000", readonly: false },
    { key: "preco_grade_4000", label: "4000", readonly: false },
    { key: "preco_grade_5000", label: "5000", readonly: false },
    { key: "preco_grade_6000", label: "6000", readonly: false },
    { key: "preco_grade_7000", label: "7000", readonly: false },
    { key: "preco_couro", label: "Couro", readonly: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tabela de Preço</h2>
        <div className="flex items-center gap-3">
          {saving && <span className="text-sm font-medium text-gray-500">Salvando...</span>}
          {saved && <span className="text-sm font-semibold text-green-600">Salvo ✓</span>}
          {error && <span className="text-sm font-semibold text-red-600">Erro ✕</span>}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onImportCsv}
            className="hidden"
            id="csv-import"
          />
          <label
            htmlFor="csv-import"
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Importar CSV
          </label>
          <button
            onClick={onExportCsv}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Exportar CSV
          </button>
          <button
            onClick={addLinha}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            + Adicionar Medida
          </button>
          <button
            onClick={checkVariacoesFaltantes}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Atualizar Skeleton
          </button>
        </div>
      </div>

      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg border border-gray-200 bg-white p-6 max-w-2xl w-full shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Variações Faltantes na Tabela de Preço</h3>
            <p className="mb-4 text-sm text-gray-600">
              Selecione as variações que deseja incluir na tabela de preço:
            </p>
            
            <div className="mb-4 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedMedidas.size === variacoesFaltantes.length && variacoesFaltantes.length > 0}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">Selecionar Todas</span>
              </div>
              <div className="divide-y divide-gray-200">
                {variacoesFaltantes.map((v: any) => (
                  <label
                    key={v.medida_cm}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMedidas.has(v.medida_cm)}
                      onChange={() => toggleMedida(v.medida_cm)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">
                        Medida: {v.medida_cm}cm
                      </div>
                      <div className="text-xs text-gray-500">
                        L: {v.largura_cm}cm × P: {v.profundidade_cm}cm × A: {v.altura_cm}cm
                        {v.largura_assento_cm > 0 && ` | Assento: ${v.largura_assento_cm}×${v.altura_assento_cm}cm`}
                        {v.largura_braco_cm > 0 && ` | Braço: ${v.largura_braco_cm}cm`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSyncModal(false);
                  setSelectedMedidas(new Set());
                  setVariacoesFaltantes([]);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={syncSkeleton}
                disabled={selectedMedidas.size === 0 || syncing}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {syncing ? "Criando..." : `Incluir ${selectedMedidas.size} variação(ões)`}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full text-base">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              {columns.map((col) => (
                <th key={col.key} className="border-b border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-700">
                  {col.label}
                </th>
              ))}
              <th className="border-b border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {linhas.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-base text-gray-500">
                  Nenhuma linha cadastrada. Use "Criar variações" na aba Variações ou adicione manualmente.
                </td>
              </tr>
            ) : (
              linhas.map((l) => (
                <tr key={l.medida_cm} className="bg-white transition-colors hover:bg-blue-50">
                  {columns.map((col) => (
                    <td key={col.key} className="border-r border-gray-200 px-2 py-2 last:border-r-0">
                      {col.isText ? (
                        <div className="px-2 py-2 text-center text-sm font-medium text-gray-900">
                          {String(l[col.key as keyof LinhaPreco] || "")}
                        </div>
                      ) : (
                        <input
                          type="number"
                          step={col.key.includes("metragem") || col.key.includes("preco") ? "0.01" : "1"}
                          min="0"
                          className={`w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-center text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            col.readonly ? "bg-gray-50 cursor-not-allowed" : ""
                          }`}
                          value={l[col.key as keyof LinhaPreco] || 0}
                          onChange={(e) => onChange(l.medida_cm, col.key as keyof LinhaPreco, e.target.value)}
                          readOnly={col.readonly}
                          onDoubleClick={(e) => {
                            if (!col.readonly) {
                              (e.target as HTMLInputElement).select();
                            }
                          }}
                        />
                      )}
                    </td>
                  ))}
                  <td className="border-r border-gray-200 px-3 py-2 text-center">
                    <button
                      onClick={() => deleteLinha(l.medida_cm)}
                      className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
    </div>
  );
}




