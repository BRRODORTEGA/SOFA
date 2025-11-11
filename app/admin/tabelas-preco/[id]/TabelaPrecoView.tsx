"use client";

import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import { AdminToolbar } from "@/components/admin/toolbar";
import { useRouter } from "next/navigation";

type LinhaPreco = {
  id?: string;
  produtoId: string;
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

export default function TabelaPrecoView({ tabelaPrecoId, tabelaNome }: { tabelaPrecoId: string; tabelaNome: string }) {
  const router = useRouter();
  const [linhas, setLinhas] = useState<LinhaPreco[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState<LinhaPreco[]>([]);
  const dirtyRef = useRef<Set<string>>(new Set()); // Chave: produtoId_medida_cm
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Map<string, Set<string>>>(new Map()); // Chave: produtoId_medida_cm, Set de campos com erro
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (tabelaPrecoId) {
      console.log("TabelaPrecoView montado, carregando linhas para:", tabelaPrecoId);
      loadLinhas();
    }
  }, [tabelaPrecoId]);

  useEffect(() => {
    if (tabelaPrecoId) {
      if (searchQuery) {
        loadLinhas(searchQuery);
      } else {
        loadLinhas();
      }
    }
  }, [searchQuery]);

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
          if (!isExternal && !isHash) {
            e.preventDefault();
            if (confirm("Você tem alterações não salvas. Deseja realmente sair sem salvar?")) {
              dirtyRef.current.clear();
              setHasUnsavedChanges(false);
              window.location.href = link.href;
            }
          }
        }
      }
    };

    document.addEventListener("click", handleRouteChange);
    return () => document.removeEventListener("click", handleRouteChange);
  }, [hasUnsavedChanges]);

  async function loadLinhas(q?: string) {
    setLoading(true);
    try {
      const url = q ? `/api/tabelas-preco/${tabelaPrecoId}/linhas?q=${encodeURIComponent(q)}` : `/api/tabelas-preco/${tabelaPrecoId}/linhas`;
      console.log("Carregando linhas da URL:", url);
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      console.log("Resposta da API:", data);
      if (data.ok) {
        const items = data.data?.items || [];
        console.log(`Carregadas ${items.length} linhas`);
        setLinhas(items.map((item: any) => ({
          ...item,
          preco_grade_1000: Number(item.preco_grade_1000),
          preco_grade_2000: Number(item.preco_grade_2000),
          preco_grade_3000: Number(item.preco_grade_3000),
          preco_grade_4000: Number(item.preco_grade_4000),
          preco_grade_5000: Number(item.preco_grade_5000),
          preco_grade_6000: Number(item.preco_grade_6000),
          preco_grade_7000: Number(item.preco_grade_7000),
          preco_couro: Number(item.preco_couro),
        })));
        dirtyRef.current.clear();
        setHasUnsavedChanges(false);
        setError(null);
      } else {
        console.error("Erro na resposta da API:", data);
        setError(data.error || "Erro ao carregar linhas");
      }
    } catch (e: any) {
      console.error("Erro ao carregar linhas:", e);
      setError(e?.message || "Erro ao carregar linhas");
    } finally {
      setLoading(false);
    }
  }

  function getKey(produtoId: string, medida_cm: number): string {
    return `${produtoId}_${medida_cm}`;
  }

  function handleFieldChange(produtoId: string, medida_cm: number, field: keyof LinhaPreco, value: string | number) {
    const key = getKey(produtoId, medida_cm);
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    
    if (isNaN(numValue) && value !== "") return;

    setLinhas((prev) =>
      prev.map((linha) => {
        if (linha.produtoId === produtoId && linha.medida_cm === medida_cm) {
          return { ...linha, [field]: numValue || 0 };
        }
        return linha;
      })
    );

    dirtyRef.current.add(key);
    setHasUnsavedChanges(true);

    // Remover erro de validação deste campo se existir
    setValidationErrors((prev) => {
      const newMap = new Map(prev);
      const errors = newMap.get(key);
      if (errors) {
        errors.delete(field);
        if (errors.size === 0) {
          newMap.delete(key);
        } else {
          newMap.set(key, errors);
        }
      }
      return newMap;
    });
  }

  async function saveChanges() {
    if (dirtyRef.current.size === 0) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const linhasParaSalvar = linhas.filter((linha) =>
        dirtyRef.current.has(getKey(linha.produtoId, linha.medida_cm))
      );

      const res = await fetch(`/api/tabelas-preco/${tabelaPrecoId}/linhas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(linhasParaSalvar),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        dirtyRef.current.clear();
        setHasUnsavedChanges(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        await loadLinhas(searchQuery || undefined);
      } else {
        setError(data.error || data.details || "Erro ao salvar");
      }
    } catch (e: any) {
      setError(e?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(produtoId: string, medida_cm: number) {
    if (!confirm(`Excluir linha para medida ${medida_cm}cm?`)) return;

    const linha = linhas.find((l) => l.produtoId === produtoId && l.medida_cm === medida_cm);
    if (!linha?.id) {
      alert("Erro: linha não encontrada");
      return;
    }

    try {
      const res = await fetch(`/api/tabelas-preco/${tabelaPrecoId}/linhas?linhaId=${linha.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        await loadLinhas(searchQuery || undefined);
      } else {
        alert(data.error || "Erro ao excluir");
      }
    } catch (e: any) {
      alert("Erro ao excluir");
    }
  }

  function onImportCsv() {
    fileInputRef.current?.click();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se há alterações pendentes
    if (hasUnsavedChanges) {
      const manter = confirm("Você tem alterações não salvas. Deseja salvá-las antes de importar?");
      if (manter) {
        await saveChanges();
        // Aguardar um pouco para garantir que salvou
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        const cancelar = confirm("Deseja cancelar o import?");
        if (cancelar) {
          e.target.value = "";
          return;
        }
      }
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Buscar todos os produtos para mapear categoria_familia_nome -> produtoId
          const produtosRes = await fetch("/api/produtos?limit=1000");
          const produtosData = await produtosRes.json();
          const produtos = produtosData.data?.items || [];

          const produtosMap = new Map<string, any>();
          produtos.forEach((p: any) => {
            const chave = `${p.categoria?.nome || ""}_${p.familia?.nome || ""}_${p.nome || ""}`.toLowerCase();
            produtosMap.set(chave, p);
          });

          const parsed: LinhaPreco[] = results.data
            .map((row: any) => {
              const categoria = (row["Categoria"] || row["categoria"] || "").trim();
              const familia = (row["Família"] || row["familia"] || "").trim();
              const produtoNome = (row["Nome Produto"] || row["nome produto"] || row["NomeProduto"] || "").trim();
              const chave = `${categoria}_${familia}_${produtoNome}`.toLowerCase();
              const produto = produtosMap.get(chave);

              if (!produto) {
                console.warn("Produto não encontrado:", chave);
                return null;
              }

              return {
                produtoId: produto.id,
                categoriaNome: categoria,
                familiaNome: familia,
                produtoNome: produtoNome,
                medida_cm: Number(row["Medida (cm)"] || row["medida_cm"] || 0),
                largura_cm: Number(row["Largura (cm)"] || row["largura_cm"] || 0),
                profundidade_cm: Number(row["Profundidade (cm)"] || row["profundidade_cm"] || 0),
                altura_cm: Number(row["Altura (cm)"] || row["altura_cm"] || 0),
                largura_assento_cm: Number(row["Larg. Assento (cm)"] || row["largura_assento_cm"] || 0),
                altura_assento_cm: Number(row["Alt. Assento (cm)"] || row["altura_assento_cm"] || 0),
                largura_braco_cm: Number(row["Larg. Braço (cm)"] || row["largura_braco_cm"] || 0),
                metragem_tecido_m: Number(row["Met. Tecido (m)"] || row["metragem_tecido_m"] || 0),
                metragem_couro_m: Number(row["Met. Couro (m)"] || row["metragem_couro_m"] || 0),
                preco_grade_1000: Number(row["1000"] || 0),
                preco_grade_2000: Number(row["2000"] || 0),
                preco_grade_3000: Number(row["3000"] || 0),
                preco_grade_4000: Number(row["4000"] || 0),
                preco_grade_5000: Number(row["5000"] || 0),
                preco_grade_6000: Number(row["6000"] || 0),
                preco_grade_7000: Number(row["7000"] || 0),
                preco_couro: Number(row["Couro"] || 0),
              };
            })
            .filter((item: any) => item !== null);

          // Mostrar preview antes de salvar
          setImportData(parsed);
          setShowImportPreview(true);
        } catch (e: any) {
          alert("Erro ao processar CSV: " + (e?.message || "Erro desconhecido"));
        }
      },
    });

    e.target.value = "";
  }

  function isFieldChanged(produtoId: string, medida_cm: number, field: keyof LinhaPreco, newValue: number): boolean {
    const linhaAtual = linhas.find((l) => l.produtoId === produtoId && l.medida_cm === medida_cm);
    if (!linhaAtual) return true;
    return linhaAtual[field] !== newValue;
  }

  async function confirmImport() {
    if (importData.length === 0) {
      alert("Nenhum dado para importar");
      return;
    }

    const confirmar = confirm(`Deseja salvar ${importData.length} linha(s) importada(s)?`);
    if (!confirmar) {
      setShowImportPreview(false);
      setImportData([]);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tabelas-preco/${tabelaPrecoId}/linhas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importData),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setShowImportPreview(false);
        setImportData([]);
        dirtyRef.current.clear();
        setHasUnsavedChanges(false);
        await loadLinhas(searchQuery || undefined);
        alert("Importação concluída com sucesso!");
      } else {
        alert(`Erro ao importar: ${data.error || data.details || "Erro desconhecido"}`);
      }
    } catch (e: any) {
      alert("Erro ao importar: " + (e?.message || "Erro desconhecido"));
    } finally {
      setSaving(false);
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

    const data = linhas.map((linha) => [
      linha.categoriaNome || "",
      linha.familiaNome || "",
      linha.produtoNome || "",
      linha.medida_cm,
      linha.largura_cm,
      linha.profundidade_cm,
      linha.altura_cm,
      linha.largura_assento_cm,
      linha.altura_assento_cm,
      linha.largura_braco_cm,
      linha.metragem_tecido_m,
      linha.metragem_couro_m,
      linha.preco_grade_1000,
      linha.preco_grade_2000,
      linha.preco_grade_3000,
      linha.preco_grade_4000,
      linha.preco_grade_5000,
      linha.preco_grade_6000,
      linha.preco_grade_7000,
      linha.preco_couro,
    ]);

    const csv = Papa.unparse({ fields: headers, data });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tabela-preco-${tabelaNome}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function validarTabela() {
    const errors = new Map<string, Set<string>>();

    // Agrupar linhas por produto (chave: categoria_familia_produto)
    const linhasPorProduto = new Map<string, LinhaPreco[]>();
    linhas.forEach((linha) => {
      const chave = `${linha.categoriaNome}_${linha.familiaNome}_${linha.produtoNome}`;
      if (!linhasPorProduto.has(chave)) {
        linhasPorProduto.set(chave, []);
      }
      linhasPorProduto.get(chave)!.push(linha);
    });

    // Validação 1: Grades crescentes
    linhas.forEach((linha) => {
      const key = getKey(linha.produtoId, linha.medida_cm);
      const camposErro = new Set<string>();

      const grades = [
        { campo: "preco_grade_1000", valor: linha.preco_grade_1000, nome: "1000" },
        { campo: "preco_grade_2000", valor: linha.preco_grade_2000, nome: "2000" },
        { campo: "preco_grade_3000", valor: linha.preco_grade_3000, nome: "3000" },
        { campo: "preco_grade_4000", valor: linha.preco_grade_4000, nome: "4000" },
        { campo: "preco_grade_5000", valor: linha.preco_grade_5000, nome: "5000" },
        { campo: "preco_grade_6000", valor: linha.preco_grade_6000, nome: "6000" },
        { campo: "preco_grade_7000", valor: linha.preco_grade_7000, nome: "7000" },
        { campo: "preco_couro", valor: linha.preco_couro, nome: "Couro" },
      ];

      for (let i = 0; i < grades.length - 1; i++) {
        if (grades[i].valor >= grades[i + 1].valor) {
          camposErro.add(grades[i].campo);
          camposErro.add(grades[i + 1].campo);
        }
      }

      if (camposErro.size > 0) {
        errors.set(key, camposErro);
      }
    });

    // Validação 2: Metragem crescente com medida
    linhasPorProduto.forEach((linhasProduto) => {
      const ordenadas = [...linhasProduto].sort((a, b) => a.medida_cm - b.medida_cm);
      for (let i = 0; i < ordenadas.length - 1; i++) {
        const atual = ordenadas[i];
        const proxima = ordenadas[i + 1];

        if (atual.metragem_tecido_m >= proxima.metragem_tecido_m) {
          const keyAtual = getKey(atual.produtoId, atual.medida_cm);
          const keyProxima = getKey(proxima.produtoId, proxima.medida_cm);
          const errosAtual = errors.get(keyAtual) || new Set();
          const errosProxima = errors.get(keyProxima) || new Set();
          errosAtual.add("metragem_tecido_m");
          errosProxima.add("metragem_tecido_m");
          errors.set(keyAtual, errosAtual);
          errors.set(keyProxima, errosProxima);
        }

        if (atual.metragem_couro_m >= proxima.metragem_couro_m) {
          const keyAtual = getKey(atual.produtoId, atual.medida_cm);
          const keyProxima = getKey(proxima.produtoId, proxima.medida_cm);
          const errosAtual = errors.get(keyAtual) || new Set();
          const errosProxima = errors.get(keyProxima) || new Set();
          errosAtual.add("metragem_couro_m");
          errosProxima.add("metragem_couro_m");
          errors.set(keyAtual, errosAtual);
          errors.set(keyProxima, errosProxima);
        }
      }
    });

    // Validação 3: Profundidade, Altura e altura_assento consistentes
    linhasPorProduto.forEach((linhasProduto) => {
      if (linhasProduto.length === 0) return;

      const primeira = linhasProduto[0];
      const profundidadeEsperada = primeira.profundidade_cm;
      const alturaEsperada = primeira.altura_cm;
      const alturaAssentoEsperada = primeira.altura_assento_cm;

      linhasProduto.forEach((linha) => {
        const key = getKey(linha.produtoId, linha.medida_cm);
        const erros = errors.get(key) || new Set();

        if (linha.profundidade_cm !== profundidadeEsperada) {
          erros.add("profundidade_cm");
        }
        if (linha.altura_cm !== alturaEsperada) {
          erros.add("altura_cm");
        }
        if (linha.altura_assento_cm !== alturaAssentoEsperada) {
          erros.add("altura_assento_cm");
        }

        if (erros.size > 0) {
          errors.set(key, erros);
        }
      });
    });

    setValidationErrors(errors);

    if (errors.size > 0) {
      const totalErros = Array.from(errors.values()).reduce((acc, set) => acc + set.size, 0);
      alert(`Validação encontrou ${errors.size} linha(s) com ${totalErros} erro(s). Verifique os campos destacados em vermelho.`);
    } else {
      alert("Tabela validada com sucesso! Nenhum erro encontrado.");
    }
  }

  function getCellErrorClass(produtoId: string, medida_cm: number, field: keyof LinhaPreco): string {
    const key = getKey(produtoId, medida_cm);
    const errors = validationErrors.get(key);
    if (errors && errors.has(field)) {
      return "border-2 border-red-500 bg-red-50";
    }
    return "";
  }

  const linhasFiltradas = linhas;
  const columns = [
    { key: "categoriaNome", header: "Categoria", readonly: true },
    { key: "familiaNome", header: "Família", readonly: true },
    { key: "produtoNome", header: "Nome Produto", readonly: true },
    { key: "medida_cm", header: "Medida (cm)", readonly: true },
    { key: "largura_cm", header: "Largura (cm)" },
    { key: "profundidade_cm", header: "Profundidade (cm)" },
    { key: "altura_cm", header: "Altura (cm)" },
    { key: "largura_assento_cm", header: "Larg. Assento (cm)" },
    { key: "altura_assento_cm", header: "Alt. Assento (cm)" },
    { key: "largura_braco_cm", header: "Larg. Braço (cm)" },
    { key: "metragem_tecido_m", header: "Met. Tecido (m)" },
    { key: "metragem_couro_m", header: "Met. Couro (m)" },
    { key: "preco_grade_1000", header: "1000" },
    { key: "preco_grade_2000", header: "2000" },
    { key: "preco_grade_3000", header: "3000" },
    { key: "preco_grade_4000", header: "4000" },
    { key: "preco_grade_5000", header: "5000" },
    { key: "preco_grade_6000", header: "6000" },
    { key: "preco_grade_7000", header: "7000" },
    { key: "preco_couro", header: "Couro" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tabela de Preço - {tabelaNome}</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-semibold text-green-600">Salvo ✓</span>}
          {saving && <span className="text-sm font-medium text-gray-500">Salvando...</span>}
          {hasUnsavedChanges && (
            <button
              onClick={saveChanges}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Salvar Alterações
            </button>
          )}
          <button
            onClick={onImportCsv}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Importar CSV
          </button>
          <button
            onClick={onExportCsv}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Exportar CSV
          </button>
          <button
            onClick={validarTabela}
            className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Validar Tabela
          </button>
        </div>
      </div>

      <AdminToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por categoria, família, produto ou medida..."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {validationErrors.size > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm font-medium text-yellow-800">
            {validationErrors.size} linha(s) com erro(s) de validação. Verifique os campos destacados em vermelho.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : linhasFiltradas.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">Nenhuma linha de preço encontrada.</p>
        </div>
      ) : (
        <>
          <div className="text-base font-medium text-gray-700">
            Total: <span className="font-semibold text-gray-900">{linhasFiltradas.length}</span> linha(s) de preço
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 last:border-r-0"
                    >
                      {col.header}
                    </th>
                  ))}
                  <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 last:border-r-0">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {linhasFiltradas.map((linha) => (
                  <tr
                    key={getKey(linha.produtoId, linha.medida_cm)}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    {columns.map((col) => {
                      const value = linha[col.key as keyof LinhaPreco];
                      const isReadonly = col.readonly;
                      const errorClass = getCellErrorClass(linha.produtoId, linha.medida_cm, col.key as keyof LinhaPreco);

                      return (
                        <td key={col.key} className="border-r border-gray-100 px-4 py-2 last:border-r-0">
                          {isReadonly ? (
                            <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                          ) : (
                            <input
                              type="number"
                              value={value || ""}
                              onChange={(e) =>
                                handleFieldChange(linha.produtoId, linha.medida_cm, col.key as keyof LinhaPreco, e.target.value)
                              }
                              className={`w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${errorClass}`}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="border-r border-gray-100 px-4 py-2 last:border-r-0">
                      <button
                        onClick={() => handleDelete(linha.produtoId, linha.medida_cm)}
                        className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {showImportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Preview da Importação</h2>
            <div className="mb-4 text-sm text-gray-600">
              {importData.length} linha(s) serão importadas. Valores alterados estão destacados.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {columns.map((col) => (
                      <th key={col.key} className="border-r border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-700">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importData.map((linha, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      {columns.map((col) => {
                        const value = linha[col.key as keyof LinhaPreco];
                        const isChanged = !col.readonly && isFieldChanged(linha.produtoId, linha.medida_cm, col.key as keyof LinhaPreco, Number(value));
                        return (
                          <td
                            key={col.key}
                            className={`border-r border-gray-100 px-2 py-1 ${isChanged ? "bg-yellow-100 font-semibold" : ""}`}
                          >
                            {String(value)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportPreview(false);
                  setImportData([]);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? "Importando..." : "Confirmar Importação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


