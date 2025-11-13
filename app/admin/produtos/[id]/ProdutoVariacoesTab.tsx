"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

type Variacao = {
  id: string;
  medida_cm: number;
  largura_cm: number;
  profundidade_cm: number;
  altura_cm: number;
  largura_assento_cm: number;
  altura_assento_cm: number;
  largura_braco_cm: number;
  metragem_tecido_m: number;
  metragem_couro_m: number;
};

export default function ProdutoVariacoesTab({ produtoId }: { produtoId: string }) {
  const router = useRouter();
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [variacoesOriginais, setVariacoesOriginais] = useState<Variacao[]>([]); // Para comparar alterações
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
    largura_assento_cm: "",
    altura_assento_cm: "",
    largura_braco_cm: "",
    metragem_tecido_m: "",
    metragem_couro_m: "",
  });
  const dirtyRef = useRef<Set<string>>(new Set()); // Chave: medida_cm_field (para persistência)
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set()); // Estado para forçar re-renderização
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const pendingNavigationRef = useRef<string | null>(null);
  const variacoesRef = useRef<Variacao[]>([]); // Ref para acessar valor atual sem dependência

  useEffect(() => {
    loadVariacoes();
  }, [produtoId]);

  // Avisar antes de fechar a aba/janela se houver alterações pendentes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "Você tem alterações não salvas. Deseja realmente sair?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Interceptar navegação do Next.js
  useEffect(() => {
    const handleRouteChange = (e: MouseEvent) => {
      if (hasUnsavedChanges) {
        const target = e.target as HTMLElement;
        const link = target.closest("a");
        if (link && link.href) {
          const isExternal = link.href.startsWith("http") && !link.href.includes(window.location.host);
          const isHash = link.href.includes("#");
          const currentUrl = window.location.pathname;
          const targetUrl = new URL(link.href).pathname;
          const isSamePage = targetUrl === currentUrl || targetUrl === currentUrl + "/" || targetUrl + "/" === currentUrl;
          
          if (!isExternal && !isHash && !isSamePage) {
            // Prevenir navegação imediatamente
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Perguntar ao usuário
            const confirmar = window.confirm("Você tem alterações não salvas. Deseja realmente sair sem salvar?");
            if (confirmar) {
              // Se confirmar, limpar estado e navegar
              dirtyRef.current.clear();
              setHasUnsavedChanges(false);
              router.push(targetUrl);
            }
          }
        }
      }
    };

    document.addEventListener("click", handleRouteChange, true);
    return () => document.removeEventListener("click", handleRouteChange, true);
  }, [hasUnsavedChanges, router]);

  // Escutar eventos de salvamento e descarte vindos do componente pai
  useEffect(() => {
    const handleSaveRequest = async (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.produtoId === produtoId && hasUnsavedChanges) {
        // Salvar alterações
        setSaving(true);
        setSaved(false);

        try {
          const medidasComAlteracoes = new Set<number>();
          dirtyRef.current.forEach((key) => {
            const [medida] = key.split("::");
            medidasComAlteracoes.add(Number(medida));
          });

          const variacoesComAlteracoes = variacoesRef.current.filter((v) =>
            medidasComAlteracoes.has(v.medida_cm)
          );

          const res = await fetch(`/api/produtos/${produtoId}/variacoes`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(variacoesComAlteracoes.map(v => ({
              medida_cm: Number(v.medida_cm),
              largura_cm: Number(v.largura_cm),
              profundidade_cm: Number(v.profundidade_cm),
              altura_cm: Number(v.altura_cm),
              largura_assento_cm: Number(v.largura_assento_cm),
              altura_assento_cm: Number(v.altura_assento_cm),
              largura_braco_cm: Number(v.largura_braco_cm),
              metragem_tecido_m: Number(v.metragem_tecido_m),
              metragem_couro_m: Number(v.metragem_couro_m),
            }))),
          });

          if (res.ok) {
            dirtyRef.current.clear();
            setDirtyFields(new Set());
            setHasUnsavedChanges(false);
            await loadVariacoes();
          }
        } catch (e) {
          console.error("Erro ao salvar:", e);
        } finally {
          setSaving(false);
        }
      }
    };

    const handleDiscardRequest = async (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.produtoId === produtoId && hasUnsavedChanges) {
        dirtyRef.current.clear();
        setDirtyFields(new Set());
        setHasUnsavedChanges(false);
        await loadVariacoes(); // Recarregar dados originais
      }
    };

    window.addEventListener("saveChangesRequest", handleSaveRequest);
    window.addEventListener("discardChangesRequest", handleDiscardRequest);
    
    return () => {
      window.removeEventListener("saveChangesRequest", handleSaveRequest);
      window.removeEventListener("discardChangesRequest", handleDiscardRequest);
    };
  }, [hasUnsavedChanges, produtoId]);

  // Expor estado de alterações não salvas para o componente pai
  useEffect(() => {
    const event = new CustomEvent("unsavedChangesState", {
      detail: { hasUnsavedChanges, produtoId, tab: "variacoes" },
    });
    window.dispatchEvent(event);
  }, [hasUnsavedChanges, produtoId]);

  async function loadVariacoes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/produtos/${produtoId}/variacoes`);
      const data = await res.json();
      if (data.ok) {
        const items = (data.data.items || []).map((item: any) => ({
          ...item,
          medida_cm: Number(item.medida_cm || 0),
          largura_cm: Number(item.largura_cm || 0),
          profundidade_cm: Number(item.profundidade_cm || 0),
          altura_cm: Number(item.altura_cm || 0),
          largura_assento_cm: Number(item.largura_assento_cm || 0),
          altura_assento_cm: Number(item.altura_assento_cm || 0),
          largura_braco_cm: Number(item.largura_braco_cm || 0),
          metragem_tecido_m: Number(item.metragem_tecido_m || 0),
          metragem_couro_m: Number(item.metragem_couro_m || 0),
        }));
        setVariacoes(items);
        variacoesRef.current = items; // Atualizar ref
        setVariacoesOriginais(JSON.parse(JSON.stringify(items))); // Deep copy para comparação
        dirtyRef.current.clear();
        setDirtyFields(new Set());
        setHasUnsavedChanges(false);
      }
    } catch (e) {
      console.error("Erro ao carregar variações:", e);
    }
    setLoading(false);
  }

  // Função para obter chave do campo
  function getFieldKey(medida: number, field: string): string {
    return `${medida}::${field}`;
  }

  // Função para verificar se um campo foi alterado
  function isFieldDirty(medida: number, field: string): boolean {
    const key = getFieldKey(medida, field);
    return dirtyFields.has(key);
  }

  async function saveChanges() {
    if (dirtyRef.current.size === 0) {
      alert("Nenhuma alteração para salvar");
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      // Coletar todas as variações com alterações
      const medidasComAlteracoes = new Set<number>();
      dirtyRef.current.forEach((key) => {
        const [medida] = key.split("::");
        medidasComAlteracoes.add(Number(medida));
      });

      const variacoesComAlteracoes = variacoesRef.current.filter((v) =>
        medidasComAlteracoes.has(v.medida_cm)
      );

      const res = await fetch(`/api/produtos/${produtoId}/variacoes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variacoesComAlteracoes.map(v => ({
          medida_cm: Number(v.medida_cm),
          largura_cm: Number(v.largura_cm),
          profundidade_cm: Number(v.profundidade_cm),
          altura_cm: Number(v.altura_cm),
          largura_assento_cm: Number(v.largura_assento_cm),
          altura_assento_cm: Number(v.altura_assento_cm),
          largura_braco_cm: Number(v.largura_braco_cm),
          metragem_tecido_m: Number(v.metragem_tecido_m),
          metragem_couro_m: Number(v.metragem_couro_m),
        }))),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setSaved(true);
        dirtyRef.current.clear();
        setDirtyFields(new Set());
        setHasUnsavedChanges(false);
        // Recarregar dados para atualizar variacoesOriginais
        await loadVariacoes();
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errorMsg = data.error?.message || data.details || "Erro ao salvar";
        alert(`Erro ao salvar: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao salvar variações:", error);
      alert("Erro ao salvar. Verifique o console para mais detalhes.");
    } finally {
      setSaving(false);
    }
  }

  function handleFieldChange(medida: number, field: keyof Variacao, value: string) {
    // Converter valor baseado no tipo de campo
    let numValue: number;
    if (field.includes("_cm")) {
      // Campos de dimensão: inteiros
      numValue = Math.max(0, Math.floor(Number(value) || 0));
    } else if (field.includes("metragem")) {
      // Campos decimais: permitir decimais
      numValue = Math.max(0, Number(value) || 0);
    } else {
      // Outros campos numéricos
      numValue = Math.max(0, Number(value) || 0);
    }
    
    if (isNaN(numValue)) return; // Ignora valores inválidos
    
    // Encontrar variação original para comparação
    const variacaoOriginal = variacoesOriginais.find((v) => v.medida_cm === medida);
    if (!variacaoOriginal) {
      console.warn(`Variação original não encontrada para medida ${medida}`);
      return;
    }
    
    const valorOriginal = Number(variacaoOriginal[field]) || 0;
    
    // Atualizar estado
    setVariacoes(prev => {
      const updated = prev.map(v => 
        v.medida_cm === medida ? { ...v, [field]: numValue } : v
      );
      variacoesRef.current = updated; // Atualizar ref
      return updated;
    });
    
    // Marcar como alterado se diferente do original (com tolerância para decimais)
    const fieldKey = getFieldKey(medida, field);
    const diferenca = Math.abs(valorOriginal - numValue);
    const tolerancia = field.includes("metragem") ? 0.001 : 0.5;
    
    if (diferenca > tolerancia) {
      dirtyRef.current.add(fieldKey);
      setDirtyFields(new Set(dirtyRef.current)); // Atualizar estado para forçar re-renderização
      setHasUnsavedChanges(true);
    } else {
      dirtyRef.current.delete(fieldKey);
      setDirtyFields(new Set(dirtyRef.current)); // Atualizar estado para forçar re-renderização
      // Verificar se ainda há alterações pendentes
      const aindaTemAlteracoes = dirtyRef.current.size > 0;
      setHasUnsavedChanges(aindaTemAlteracoes);
    }
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
        largura_assento_cm: Number(newVariacao.largura_assento_cm) || 0,
        altura_assento_cm: Number(newVariacao.altura_assento_cm) || 0,
        largura_braco_cm: Number(newVariacao.largura_braco_cm) || 0,
        metragem_tecido_m: Number(newVariacao.metragem_tecido_m),
        metragem_couro_m: Number(newVariacao.metragem_couro_m),
      }),
    });
    if (res.ok) {
      setShowAddForm(false);
      setNewVariacao({
        medida_cm: "", largura_cm: "", profundidade_cm: "", altura_cm: "",
        largura_assento_cm: "", altura_assento_cm: "", largura_braco_cm: "",
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
      // Remover todas as chaves relacionadas a esta medida
      dirtyRef.current.forEach((key) => {
        if (key.startsWith(`${medida}::`)) {
          dirtyRef.current.delete(key);
        }
      });
      setDirtyFields(new Set(dirtyRef.current));
      setHasUnsavedChanges(dirtyRef.current.size > 0);
      loadVariacoes();
    } else {
      alert("Erro ao excluir");
    }
  }

  async function handleGenerate() {
    const custom = medidasCustom.split(",").map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    try {
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
      
      const data = await res.json();
      
      if (res.ok && data.ok) {
        setShowModal(false);
        if (data.data.created === 0) {
          alert("Todas as medidas já existem");
        } else {
          // Mostrar mensagem de sucesso
          alert(`${data.data.created} variação(ões) criada(s) com sucesso!`);
        }
        loadVariacoes();
      } else {
        // Se res.ok mas data.ok é false, ou se res.ok é false
        const errorMsg = data.error || data.message || "Erro ao gerar variações";
        alert(`Erro ao gerar variações: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao gerar variações:", error);
      alert("Erro ao gerar variações. Verifique o console para mais detalhes.");
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
          {saving && <span className="text-sm font-medium text-gray-500">Salvando...</span>}
          {saved && <span className="text-sm font-semibold text-green-600">Salvo ✓</span>}
          {hasUnsavedChanges && (
            <button
              onClick={saveChanges}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          )}
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
              placeholder="Largura Assento (cm)"
              value={newVariacao.largura_assento_cm}
              onChange={(e) => setNewVariacao({...newVariacao, largura_assento_cm: e.target.value})}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Altura Assento (cm)"
              value={newVariacao.altura_assento_cm}
              onChange={(e) => setNewVariacao({...newVariacao, altura_assento_cm: e.target.value})}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Largura Braço (cm)"
              value={newVariacao.largura_braco_cm}
              onChange={(e) => setNewVariacao({...newVariacao, largura_braco_cm: e.target.value})}
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Larg. Assento (cm)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Alt. Assento (cm)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Larg. Braço (cm)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Met. Tecido (m)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Met. Couro (m)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {variacoes.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-base text-gray-500">Nenhuma variação cadastrada</td></tr>
            ) : (
              variacoes.map((v) => (
                <tr key={v.id} className="bg-white transition-colors hover:bg-blue-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{v.medida_cm}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={v.largura_cm}
                      onChange={(e) => handleFieldChange(v.medida_cm, "largura_cm", e.target.value)}
                      className={`w-24 rounded-lg border px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 ${
                        isFieldDirty(v.medida_cm, "largura_cm")
                          ? "border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500"
                          : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={v.profundidade_cm}
                      onChange={(e) => handleFieldChange(v.medida_cm, "profundidade_cm", e.target.value)}
                      className={`w-24 rounded-lg border px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 ${
                        isFieldDirty(v.medida_cm, "profundidade_cm")
                          ? "border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500"
                          : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={v.altura_cm}
                      onChange={(e) => handleFieldChange(v.medida_cm, "altura_cm", e.target.value)}
                      className={`w-24 rounded-lg border px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 ${
                        isFieldDirty(v.medida_cm, "altura_cm")
                          ? "border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500"
                          : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={v.largura_assento_cm || 0}
                      onChange={(e) => handleFieldChange(v.medida_cm, "largura_assento_cm", e.target.value)}
                      className={`w-24 rounded-lg border px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 ${
                        isFieldDirty(v.medida_cm, "largura_assento_cm")
                          ? "border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500"
                          : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={v.altura_assento_cm || 0}
                      onChange={(e) => handleFieldChange(v.medida_cm, "altura_assento_cm", e.target.value)}
                      className={`w-24 rounded-lg border px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 ${
                        isFieldDirty(v.medida_cm, "altura_assento_cm")
                          ? "border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500"
                          : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={v.largura_braco_cm || 0}
                      onChange={(e) => handleFieldChange(v.medida_cm, "largura_braco_cm", e.target.value)}
                      className={`w-24 rounded-lg border px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 ${
                        isFieldDirty(v.medida_cm, "largura_braco_cm")
                          ? "border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500"
                          : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.1"
                      value={v.metragem_tecido_m}
                      onChange={(e) => handleFieldChange(v.medida_cm, "metragem_tecido_m", e.target.value)}
                      className={`w-28 rounded-lg border px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 ${
                        isFieldDirty(v.medida_cm, "metragem_tecido_m")
                          ? "border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500"
                          : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.1"
                      value={v.metragem_couro_m}
                      onChange={(e) => handleFieldChange(v.medida_cm, "metragem_couro_m", e.target.value)}
                      className={`w-28 rounded-lg border px-3 py-2 text-base text-gray-900 focus:outline-none focus:ring-2 ${
                        isFieldDirty(v.medida_cm, "metragem_couro_m")
                          ? "border-yellow-400 bg-yellow-50 focus:border-yellow-500 focus:ring-yellow-500"
                          : "border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                      }`}
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

