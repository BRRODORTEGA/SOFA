"use client";

import { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import { AdminToolbar } from "@/components/admin/toolbar";

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

export default function TabelaPrecoGlobal() {
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
    loadLinhas();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      loadLinhas(searchQuery);
    } else {
      loadLinhas();
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
      const url = q ? `/api/tabela-preco?q=${encodeURIComponent(q)}` : `/api/tabela-preco`;
      const res = await fetch(url);
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
        // Resetar alterações pendentes ao carregar dados
        dirtyRef.current.clear();
        setHasUnsavedChanges(false);
      }
    } catch (e) {
      setError("Erro ao carregar dados");
    }
    setLoading(false);
  }

  // Função manual para salvar alterações (não é mais automática)
  async function salvarAlteracoes() {
    const toSave = linhas.filter((l) => 
      dirtyRef.current.has(getKey(l.produtoId, l.medida_cm))
    );
    
    if (toSave.length === 0) {
      alert("Nenhuma alteração para salvar");
      return;
    }

    setSaving(true);
    setSaved(false);
    setError(null);
    
    try {
      const res = await fetch(`/api/tabela-preco`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      
      if (res.ok) {
        setSaved(true);
        dirtyRef.current.clear();
        setHasUnsavedChanges(false);
        setTimeout(() => setSaved(false), 3000);
        // Recarregar dados para garantir sincronização
        await loadLinhas(searchQuery || undefined);
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao salvar");
      }
    } catch (e) {
      setError("Erro ao salvar");
    }
    
    setSaving(false);
  }

  function getKey(produtoId: string, medida: number): string {
    return `${produtoId}_${medida}`;
  }

  function getProdutoKey(linha: LinhaPreco): string {
    return `${linha.categoriaNome || ""}_${linha.familiaNome || ""}_${linha.produtoNome || ""}`;
  }

  // Função de validação
  function validarTabela(): { errors: Map<string, Set<string>>; messages: string[] } {
    const errors = new Map<string, Set<string>>();
    const messages: string[] = [];

    // Agrupar linhas por chave do produto (Categoria_Família_Nome)
    const linhasPorProduto = new Map<string, LinhaPreco[]>();
    linhas.forEach((linha) => {
      const key = getProdutoKey(linha);
      if (!linhasPorProduto.has(key)) {
        linhasPorProduto.set(key, []);
      }
      linhasPorProduto.get(key)!.push(linha);
    });

    // VALIDAÇÃO 1: Valores das grades crescentes (1000 < 2000 < 3000 < 4000 < 5000 < 6000 < 7000 < Couro)
    linhas.forEach((linha) => {
      const key = getKey(linha.produtoId, linha.medida_cm);
      const linhaErrors = new Set<string>();

      const precos = [
        { field: "preco_grade_1000", value: linha.preco_grade_1000 },
        { field: "preco_grade_2000", value: linha.preco_grade_2000 },
        { field: "preco_grade_3000", value: linha.preco_grade_3000 },
        { field: "preco_grade_4000", value: linha.preco_grade_4000 },
        { field: "preco_grade_5000", value: linha.preco_grade_5000 },
        { field: "preco_grade_6000", value: linha.preco_grade_6000 },
        { field: "preco_grade_7000", value: linha.preco_grade_7000 },
        { field: "preco_couro", value: linha.preco_couro },
      ];

      for (let i = 0; i < precos.length - 1; i++) {
        if (precos[i].value >= precos[i + 1].value) {
          linhaErrors.add(precos[i].field);
          linhaErrors.add(precos[i + 1].field);
          messages.push(
            `[${linha.categoriaNome}/${linha.familiaNome}/${linha.produtoNome} - ${linha.medida_cm}cm] ` +
            `Preço ${precos[i].field.replace("preco_grade_", "").replace("preco_", "")} (${precos[i].value}) ` +
            `não pode ser maior ou igual a ${precos[i + 1].field.replace("preco_grade_", "").replace("preco_", "")} (${precos[i + 1].value})`
          );
        }
      }

      if (linhaErrors.size > 0) {
        errors.set(key, linhaErrors);
      }
    });

    // VALIDAÇÃO 2: Metragem de tecido e couro crescente conforme medida aumenta
    linhasPorProduto.forEach((linhasProduto, produtoKey) => {
      // Ordenar por medida
      const linhasOrdenadas = [...linhasProduto].sort((a, b) => a.medida_cm - b.medida_cm);

      for (let i = 0; i < linhasOrdenadas.length - 1; i++) {
        const linhaMenor = linhasOrdenadas[i];
        const linhaMaior = linhasOrdenadas[i + 1];

        if (linhaMenor.medida_cm >= linhaMaior.medida_cm) continue;

        const keyMenor = getKey(linhaMenor.produtoId, linhaMenor.medida_cm);
        const keyMaior = getKey(linhaMaior.produtoId, linhaMaior.medida_cm);

        // Validar metragem de tecido
        if (linhaMenor.metragem_tecido_m >= linhaMaior.metragem_tecido_m) {
          if (!errors.has(keyMenor)) errors.set(keyMenor, new Set());
          if (!errors.has(keyMaior)) errors.set(keyMaior, new Set());
          errors.get(keyMenor)!.add("metragem_tecido_m");
          errors.get(keyMaior)!.add("metragem_tecido_m");
          messages.push(
            `[${produtoKey}] Metragem de tecido deve ser crescente: ` +
            `medida ${linhaMenor.medida_cm}cm (${linhaMenor.metragem_tecido_m}m) ` +
            `deve ser menor que medida ${linhaMaior.medida_cm}cm (${linhaMaior.metragem_tecido_m}m)`
          );
        }

        // Validar metragem de couro
        if (linhaMenor.metragem_couro_m >= linhaMaior.metragem_couro_m) {
          if (!errors.has(keyMenor)) errors.set(keyMenor, new Set());
          if (!errors.has(keyMaior)) errors.set(keyMaior, new Set());
          errors.get(keyMenor)!.add("metragem_couro_m");
          errors.get(keyMaior)!.add("metragem_couro_m");
          messages.push(
            `[${produtoKey}] Metragem de couro deve ser crescente: ` +
            `medida ${linhaMenor.medida_cm}cm (${linhaMenor.metragem_couro_m}m) ` +
            `deve ser menor que medida ${linhaMaior.medida_cm}cm (${linhaMaior.metragem_couro_m}m)`
          );
        }
      }
    });

    // VALIDAÇÃO 3: Profundidade, Altura e altura_assento devem ser iguais para o mesmo produto
    linhasPorProduto.forEach((linhasProduto, produtoKey) => {
      if (linhasProduto.length < 2) return; // Precisa de pelo menos 2 medidas para comparar

      // Pegar valores da primeira linha como referência
      const primeira = linhasProduto[0];
      const refProfundidade = primeira.profundidade_cm;
      const refAltura = primeira.altura_cm;
      const refAlturaAssento = primeira.altura_assento_cm;

      linhasProduto.forEach((linha) => {
        const key = getKey(linha.produtoId, linha.medida_cm);
        const linhaErrors = new Set<string>();

        if (linha.profundidade_cm !== refProfundidade) {
          linhaErrors.add("profundidade_cm");
        }
        if (linha.altura_cm !== refAltura) {
          linhaErrors.add("altura_cm");
        }
        if (linha.altura_assento_cm !== refAlturaAssento) {
          linhaErrors.add("altura_assento_cm");
        }

        if (linhaErrors.size > 0) {
          if (!errors.has(key)) errors.set(key, new Set());
          linhaErrors.forEach((field) => errors.get(key)!.add(field));
          
          const camposErrados: string[] = [];
          if (linha.profundidade_cm !== refProfundidade) camposErrados.push(`Profundidade: ${linha.profundidade_cm} (esperado: ${refProfundidade})`);
          if (linha.altura_cm !== refAltura) camposErrados.push(`Altura: ${linha.altura_cm} (esperado: ${refAltura})`);
          if (linha.altura_assento_cm !== refAlturaAssento) camposErrados.push(`Alt. Assento: ${linha.altura_assento_cm} (esperado: ${refAlturaAssento})`);
          
          messages.push(
            `[${produtoKey} - ${linha.medida_cm}cm] Dimensões inconsistentes: ${camposErrados.join(", ")}`
          );
        }
      });
    });

    return { errors, messages };
  }

  function executarValidacao() {
    const { errors, messages } = validarTabela();
    setValidationErrors(errors);

    if (errors.size === 0) {
      alert("✅ Validação concluída! Nenhuma inconsistência encontrada.");
    } else {
      const mensagemCompleta = 
        `❌ Foram encontradas ${errors.size} linha(s) com inconsistências:\n\n` +
        messages.slice(0, 20).join("\n") +
        (messages.length > 20 ? `\n\n... e mais ${messages.length - 20} erro(s)` : "");
      alert(mensagemCompleta);
    }
  }

  function onChange(produtoId: string, medida: number, field: keyof LinhaPreco, value: string) {
    const numValue = field === "medida_cm" || field.includes("_cm") 
      ? Math.max(0, Math.floor(Number(value) || 0))
      : Math.max(0, Number(value) || 0);
    
    const key = getKey(produtoId, medida);
    
    setLinhas((prev) =>
      prev.map((l) => {
        if (getKey(l.produtoId, l.medida_cm) === key) {
          return { ...l, [field]: numValue };
        }
        return l;
      })
    );
    
    // Marcar como alterado (sem salvar automaticamente)
    dirtyRef.current.add(key);
    setHasUnsavedChanges(true);
  }

  async function deleteLinha(produtoId: string, medida: number) {
    if (!confirm(`Excluir linha de ${medida}cm do produto?`)) return;
    const res = await fetch(`/api/produtos/${produtoId}/tabela-preco?medida=${medida}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setLinhas(linhas.filter((l) => !(l.produtoId === produtoId && l.medida_cm === medida)));
      dirtyRef.current.delete(getKey(produtoId, medida));
    } else {
      alert("Erro ao excluir");
    }
  }

  async function salvarAlteracoesPendentes(): Promise<boolean> {
    if (dirtyRef.current.size === 0) return true;
    
    const toSave = linhas.filter((l) => 
      dirtyRef.current.has(getKey(l.produtoId, l.medida_cm))
    );
    
    if (toSave.length === 0) return true;
    
    try {
      const res = await fetch(`/api/tabela-preco`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      
      if (res.ok) {
        dirtyRef.current.clear();
        setHasUnsavedChanges(false);
        return true;
      } else {
        const data = await res.json();
        alert(`Erro ao salvar alterações: ${data.error || "Erro desconhecido"}`);
        return false;
      }
    } catch (e) {
      alert("Erro ao salvar alterações pendentes");
      return false;
    }
  }

  // Função para verificar se um campo mudou comparando com dados atuais
  function isFieldChanged(importedLine: LinhaPreco, fieldKey: string): boolean {
    // Campos textuais e readonly não devem ser comparados
    const col = columns.find((c) => c.key === fieldKey);
    if (!col || col.readonly || col.isText) {
      return false;
    }

    // Encontrar linha correspondente nos dados atuais
    const currentLine = linhas.find(
      (l) => l.produtoId === importedLine.produtoId && l.medida_cm === importedLine.medida_cm
    );

    // Se não existe linha atual, é uma nova linha (todos os campos editáveis são "mudanças")
    if (!currentLine) {
      return true;
    }

    const importedValue = importedLine[fieldKey as keyof LinhaPreco];
    const currentValue = currentLine[fieldKey as keyof LinhaPreco];

    // Comparar valores numéricos (tratando 0, null, undefined)
    const importedNum = Number(importedValue) || 0;
    const currentNum = Number(currentValue) || 0;

    return Math.abs(importedNum - currentNum) > 0.01; // Tolerância para decimais
  }

  async function confirmarImport() {
    if (importData.length === 0) return;

    try {
      const res = await fetch(`/api/tabela-preco`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importData),
      });

      if (res.ok) {
        setShowImportPreview(false);
        setImportData([]);
        loadLinhas();
        alert("CSV importado com sucesso!");
      } else {
        const errorData = await res.json();
        alert(`Erro ao importar CSV: ${errorData.error || "Erro desconhecido"}`);
      }
    } catch (e) {
      alert("Erro ao importar CSV");
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function cancelarImport() {
    setShowImportPreview(false);
    setImportData([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se há alterações pendentes
    if (dirtyRef.current.size > 0) {
      const manter = confirm(
        `Você tem ${dirtyRef.current.size} alteração(ões) não salva(s). Deseja manter essas alterações antes de importar o CSV?\n\n` +
        `Clique em "OK" para salvar as alterações e continuar com o import.\n` +
        `Clique em "Cancelar" para cancelar o import.`
      );
      
      if (!manter) {
        // Usuário cancelou o import
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      
      // Salvar alterações pendentes
      const salvou = await salvarAlteracoesPendentes();
      if (!salvou) {
        // Erro ao salvar, cancelar import
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Para importação global, precisamos identificar o produto
          // Vamos usar categoria, família e nome do produto para identificar
          const produtosMap = new Map<string, string>(); // chave: categoria_familia_nome -> produtoId
          
          // Primeiro, buscar todos os produtos para mapear
          const produtosRes = await fetch("/api/produtos?limit=1000");
          const produtosData = await produtosRes.json();
          if (produtosData.ok) {
            produtosData.data.items.forEach((p: any) => {
              const categoriaNome = p.categoria?.nome || p.categoriaNome || "";
              const familiaNome = p.familia?.nome || p.familiaNome || "";
              const produtoNome = p.nome || "";
              const key = `${categoriaNome}_${familiaNome}_${produtoNome}`;
              produtosMap.set(key, p.id);
            });
          }

          const data = results.data.map((row: any) => {
            const categoria = row["Categoria"] || row.categoria || "";
            const familia = row["Família"] || row.familia || "";
            const produtoNome = row["Nome Produto"] || row.produtoNome || row["Nome do Produto"] || "";
            const key = `${categoria}_${familia}_${produtoNome}`;
            const produtoId = produtosMap.get(key);

            if (!produtoId) {
              throw new Error(`Produto não encontrado: ${categoria} / ${familia} / ${produtoNome}`);
            }

            return {
              produtoId,
              medida_cm: Number(row["Medida (cm)"] || row.medida_cm || 0),
              largura_cm: Number(row["Largura (cm)"] || row.largura_cm || 0),
              profundidade_cm: Number(row["Profundidade (cm)"] || row.profundidade_cm || 0),
              altura_cm: Number(row["Altura (cm)"] || row.altura_cm || 0),
              largura_assento_cm: Number(row["Larg. Assento (cm)"] || row.largura_assento_cm || row["Largura Assento (cm)"] || 0),
              altura_assento_cm: Number(row["Alt. Assento (cm)"] || row.altura_assento_cm || row["Altura Assento (cm)"] || 0),
              largura_braco_cm: Number(row["Larg. Braço (cm)"] || row.largura_braco_cm || row["Largura Braço (cm)"] || 0),
              metragem_tecido_m: Number(row["Met. Tecido (m)"] || row.metragem_tecido_m || row["Metragem Tecido (m)"] || 0),
              metragem_couro_m: Number(row["Met. Couro (m)"] || row.metragem_couro_m || row["Metragem Couro (m)"] || 0),
              preco_grade_1000: Number(row["1000"] || row.preco_grade_1000 || row["G1000"] || 0),
              preco_grade_2000: Number(row["2000"] || row.preco_grade_2000 || row["G2000"] || 0),
              preco_grade_3000: Number(row["3000"] || row.preco_grade_3000 || row["G3000"] || 0),
              preco_grade_4000: Number(row["4000"] || row.preco_grade_4000 || row["G4000"] || 0),
              preco_grade_5000: Number(row["5000"] || row.preco_grade_5000 || row["G5000"] || 0),
              preco_grade_6000: Number(row["6000"] || row.preco_grade_6000 || row["G6000"] || 0),
              preco_grade_7000: Number(row["7000"] || row.preco_grade_7000 || row["G7000"] || 0),
              preco_couro: Number(row["Couro"] || row.preco_couro || 0),
            };
          });

          // Enriquecer dados com nomes de categoria, família e produto para exibição
          const dataEnriquecida = data.map((item) => {
            const produto = produtosData.data.items.find((p: any) => p.id === item.produtoId);
            return {
              ...item,
              categoriaNome: produto?.categoria?.nome || produto?.categoriaNome || "",
              familiaNome: produto?.familia?.nome || produto?.familiaNome || "",
              produtoNome: produto?.nome || "",
            };
          });

          // Mostrar preview dos dados importados
          setImportData(dataEnriquecida);
          setShowImportPreview(true);
        } catch (e: any) {
          alert(`Erro ao processar CSV: ${e.message || "Erro desconhecido"}`);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      error: (error) => {
        alert(`Erro ao ler CSV: ${error.message}`);
      },
    });
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
    a.download = `tabela_preco_global_${new Date().toISOString().split("T")[0]}.csv`;
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
        <h1 className="text-3xl font-bold text-gray-900">Tabela de Preço - Gestão Global</h1>
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-sm font-medium text-orange-600">
              {dirtyRef.current.size} alteração(ões) não salva(s)
            </span>
          )}
          {saving && <span className="text-sm font-medium text-gray-500">Salvando...</span>}
          {saved && <span className="text-sm font-semibold text-green-600">Salvo ✓</span>}
          {error && <span className="text-sm font-semibold text-red-600">Erro ✕</span>}
          {hasUnsavedChanges && (
            <button
              onClick={salvarAlteracoes}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          )}
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
            onClick={executarValidacao}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            Validar Tabela
          </button>
        </div>
      </div>

      {validationErrors.size > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-red-900">
              ⚠️ {validationErrors.size} linha(s) com inconsistências encontradas
            </h3>
            <button
              onClick={() => setValidationErrors(new Map())}
              className="text-sm font-medium text-red-700 hover:text-red-900"
            >
              Limpar validação
            </button>
          </div>
          <p className="text-sm text-red-700">
            Os campos com erro estão destacados em vermelho na tabela abaixo.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por categoria, família, produto ou medida..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="text-base font-medium text-gray-700">
        Total: <span className="font-semibold text-gray-900">{linhas.length}</span> linha(s) de preço
      </div>

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
                  {searchQuery ? "Nenhuma linha encontrada para a busca." : "Nenhuma linha cadastrada."}
                </td>
              </tr>
            ) : (
              linhas.map((l) => {
                const linhaKey = getKey(l.produtoId, l.medida_cm);
                const linhaErrors = validationErrors.get(linhaKey) || new Set<string>();
                
                return (
                  <tr key={linhaKey} className="bg-white transition-colors hover:bg-blue-50">
                    {columns.map((col) => {
                      const hasError = linhaErrors.has(col.key);
                      return (
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
                              className={`w-full rounded-lg border px-2 py-2 text-center text-sm font-medium focus:outline-none focus:ring-2 ${
                                hasError
                                  ? "border-red-500 bg-red-100 text-red-900 focus:ring-red-500"
                                  : col.readonly
                                  ? "border-gray-300 bg-gray-50 text-gray-900 cursor-not-allowed"
                                  : "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                              }`}
                              value={l[col.key as keyof LinhaPreco] || 0}
                              onChange={(e) => {
                                onChange(l.produtoId, l.medida_cm, col.key as keyof LinhaPreco, e.target.value);
                                // Remover erro ao editar
                                if (hasError) {
                                  const newErrors = new Map(validationErrors);
                                  const linhaErros = new Set(linhaErrors);
                                  linhaErros.delete(col.key);
                                  if (linhaErros.size === 0) {
                                    newErrors.delete(linhaKey);
                                  } else {
                                    newErrors.set(linhaKey, linhaErros);
                                  }
                                  setValidationErrors(newErrors);
                                }
                              }}
                              readOnly={col.readonly}
                              onDoubleClick={(e) => {
                                if (!col.readonly) {
                                  (e.target as HTMLInputElement).select();
                                }
                              }}
                            />
                          )}
                        </td>
                      );
                    })}
                  <td className="border-r border-gray-200 px-3 py-2 text-center">
                    <button
                      onClick={() => deleteLinha(l.produtoId, l.medida_cm)}
                      className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showImportPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg border border-gray-200 bg-white p-6 max-w-[95vw] w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Preview - Dados Importados do CSV</h3>
            <p className="mb-4 text-sm text-gray-600">
              Revise os dados abaixo. Clique em "Confirmar Import" para salvar ou "Cancelar" para descartar.
            </p>
            
            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg mb-4">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {columns.map((col) => (
                      <th key={col.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-b border-gray-200">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {importData.map((l, idx) => (
                    <tr key={idx} className="hover:bg-blue-50">
                      {columns.map((col) => {
                        const changed = isFieldChanged(l, col.key);
                        return (
                          <td
                            key={col.key}
                            className={`px-3 py-2 text-sm text-gray-900 ${
                              changed ? "bg-yellow-100 font-semibold" : ""
                            }`}
                          >
                            {col.isText ? (
                              <div className="font-medium">{String(l[col.key as keyof LinhaPreco] || "")}</div>
                            ) : (
                              <div className="text-right">
                                {String(l[col.key as keyof LinhaPreco] || 0)}
                                {changed && (
                                  <span className="ml-1 text-xs text-yellow-700" title="Valor alterado">
                                    ✏️
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm font-medium text-gray-700">
                Total: <span className="font-semibold text-gray-900">{importData.length}</span> linha(s) para importar
              </div>
              <div className="flex gap-3">
                <button
                  onClick={cancelarImport}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarImport}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Confirmar Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

