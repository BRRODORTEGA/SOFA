"use client";

import { useEffect, useState, useMemo, useRef } from "react";

type Tecido = {
  id: string;
  nome: string;
  grade: string;
  imagemUrl: string | null;
  ativo: boolean;
};

const GRADES_ORDER = ["G1000", "G2000", "G3000", "G4000", "G5000", "G6000", "G7000", "COURO"];

// Componente para checkbox com estado indeterminado
function GradeCheckbox({ 
  checked, 
  indeterminate, 
  onChange 
}: { 
  checked: boolean; 
  indeterminate: boolean; 
  onChange: () => void;
}) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
    />
  );
}

export default function ProdutoTecidosTab({ produtoId }: { produtoId: string }) {
  const [tecidos, setTecidos] = useState<Tecido[]>([]);
  const [tecidosVinculados, setTecidosVinculados] = useState<Tecido[]>([]);
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

  // Agrupar tecidos por grade
  const tecidosPorGrade = useMemo(() => {
    const filtrados = tecidos.filter(t => 
      t.ativo && t.nome.toLowerCase().includes(search.toLowerCase())
    );

    const agrupados: Record<string, Tecido[]> = {};
    filtrados.forEach(t => {
      if (!agrupados[t.grade]) {
        agrupados[t.grade] = [];
      }
      agrupados[t.grade].push(t);
    });

    // Ordenar por ordem definida
    const ordenados: Record<string, Tecido[]> = {};
    GRADES_ORDER.forEach(grade => {
      if (agrupados[grade]) {
        ordenados[grade] = agrupados[grade].sort((a, b) => a.nome.localeCompare(b.nome));
      }
    });

    return ordenados;
  }, [tecidos, search]);

  function toggleAllInGrade(grade: string) {
    const tecidosNaGrade = tecidosPorGrade[grade] || [];
    const todosSelecionados = tecidosNaGrade.every(t => tecidoIds.includes(t.id));
    
    if (todosSelecionados) {
      // Desmarcar todos da grade
      setTecidoIds(prev => prev.filter(id => !tecidosNaGrade.some(t => t.id === id)));
    } else {
      // Marcar todos da grade
      const idsParaAdicionar = tecidosNaGrade
        .filter(t => !tecidoIds.includes(t.id))
        .map(t => t.id);
      setTecidoIds(prev => [...prev, ...idsParaAdicionar]);
    }
  }

  function isGradeAllSelected(grade: string): boolean {
    const tecidosNaGrade = tecidosPorGrade[grade] || [];
    if (tecidosNaGrade.length === 0) return false;
    return tecidosNaGrade.every(t => tecidoIds.includes(t.id));
  }

  function isGradePartiallySelected(grade: string): boolean {
    const tecidosNaGrade = tecidosPorGrade[grade] || [];
    if (tecidosNaGrade.length === 0) return false;
    const selecionados = tecidosNaGrade.filter(t => tecidoIds.includes(t.id));
    return selecionados.length > 0 && selecionados.length < tecidosNaGrade.length;
  }

  const totalSelecionados = tecidoIds.length;
  const totalTecidos = Object.values(tecidosPorGrade).flat().length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tecidos Vinculados</h2>
        <div className="flex items-center gap-3">
          {totalSelecionados > 0 && (
            <span className="text-sm font-medium text-gray-600">
              {totalSelecionados} de {totalTecidos} selecionado{totalSelecionados !== 1 ? "s" : ""}
            </span>
          )}
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

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {Object.keys(tecidosPorGrade).length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-base text-gray-500">Nenhum tecido encontrado</p>
          </div>
        ) : (
          Object.entries(tecidosPorGrade).map(([grade, tecidosNaGrade]) => {
            const todosSelecionados = isGradeAllSelected(grade);
            const parcialmenteSelecionados = isGradePartiallySelected(grade);
            
            return (
              <div key={grade} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                {/* Cabeçalho da Grade */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <GradeCheckbox
                      checked={todosSelecionados}
                      indeterminate={parcialmenteSelecionados}
                      onChange={() => toggleAllInGrade(grade)}
                    />
                    <span className={`text-lg font-bold ${
                      grade === "COURO" 
                        ? "text-amber-800" 
                        : "text-blue-800"
                    }`}>
                      {grade}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      ({tecidosNaGrade.length} tecido{tecidosNaGrade.length !== 1 ? "s" : ""})
                    </span>
                  </div>
                </div>

                {/* Lista de Tecidos da Grade */}
                <div className="divide-y divide-gray-100">
                  {tecidosNaGrade.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-blue-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={tecidoIds.includes(t.id)}
                          onChange={() => toggleTecido(t.id)}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        
                        {/* Preview da Imagem */}
                        {t.imagemUrl ? (
                          <img
                            src={t.imagemUrl}
                            alt={t.nome}
                            className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-400">Sem imagem</span>
                          </div>
                        )}
                        
                        <span className="text-base font-semibold text-gray-900 flex-1">
                          {t.nome}
                        </span>
                      </div>
                      
                      {tecidosVinculados.some(v => v.id === t.id) && (
                        <button
                          onClick={() => handleRemove(t.id)}
                          className="ml-4 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}




