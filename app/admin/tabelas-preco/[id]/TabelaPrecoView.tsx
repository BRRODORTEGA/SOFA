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
  descontoPercentual?: number | null;
};

export default function TabelaPrecoView({ tabelaPrecoId, tabelaNome }: { tabelaPrecoId: string; tabelaNome: string }) {
  const router = useRouter();
  const [linhas, setLinhas] = useState<LinhaPreco[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState(""); // Estado separado para o input
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState<LinhaPreco[]>([]);
  const dirtyRef = useRef<Set<string>>(new Set()); // Chave: produtoId::medida::field
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Map<string, Set<string>>>(new Map()); // Chave: produtoId_medida_cm, Set de campos com erro
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showAddProductsModal, setShowAddProductsModal] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Set<string>>(new Set());
  const [familiasSelecionadas, setFamiliasSelecionadas] = useState<Set<string>>(new Set());
  const [produtosSelecionados, setProdutosSelecionados] = useState<Set<string>>(new Set());
  const [variacoesSelecionadas, setVariacoesSelecionadas] = useState<{ [produtoId: string]: Set<number> }>({});
  const [variacoesPorProduto, setVariacoesPorProduto] = useState<{ [produtoId: string]: Array<{ medida_cm: number }> }>({});
  const [adicionando, setAdicionando] = useState(false);
  const [searchCategoriaAdd, setSearchCategoriaAdd] = useState("");
  const [searchFamiliaAdd, setSearchFamiliaAdd] = useState("");
  const [searchProdutoAdd, setSearchProdutoAdd] = useState("");

  useEffect(() => {
    if (tabelaPrecoId) {
      console.log("TabelaPrecoView montado, carregando linhas para:", tabelaPrecoId);
      loadLinhas();
    }
  }, [tabelaPrecoId]);

  useEffect(() => {
    if (showAddProductsModal) {
      console.log("Modal aberto, carregando dados...");
      loadCategorias();
      loadFamilias();
      loadProdutos();
    } else {
      // Limpar seleções quando fechar o modal
      setCategoriasSelecionadas(new Set());
      setFamiliasSelecionadas(new Set());
      setProdutosSelecionados(new Set());
      setVariacoesSelecionadas({});
      setVariacoesPorProduto({});
    }
  }, [showAddProductsModal]);

  useEffect(() => {
    produtosSelecionados.forEach(async (produtoId) => {
      if (!variacoesPorProduto[produtoId]) {
        await loadVariacoesProduto(produtoId);
      }
    });
  }, [produtosSelecionados]);

  // Debounce para busca: aguarda 300ms após parar de digitar
  useEffect(() => {
    // Limpar timeout anterior se existir
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Criar novo timeout
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInput]);

  // Efeito para carregar linhas quando searchQuery mudar (após debounce)
  useEffect(() => {
    if (tabelaPrecoId) {
      // Não mostrar loading durante busca para não perder foco no input
      if (searchQuery) {
        loadLinhas(searchQuery, true);
      } else {
        loadLinhas(undefined, true);
      }
    }
  }, [searchQuery, tabelaPrecoId]);

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
              // Usar router.push para navegação do Next.js
              router.push(targetUrl);
            }
            return false;
          }
        }
      }
    };

    // Usar capture phase para interceptar antes de outros listeners (incluindo Next.js Link)
    document.addEventListener("click", handleRouteChange, true);
    return () => document.removeEventListener("click", handleRouteChange, true);
  }, [hasUnsavedChanges, router]);

  async function loadCategorias() {
    const res = await fetch("/api/categorias");
    const data = await res.json();
    if (data.ok) setCategorias(data.data?.items || []);
  }

  async function loadFamilias() {
    // Usar parâmetro all=true para buscar TODAS as famílias (ativas e inativas)
    const res = await fetch("/api/familias?all=true");
    const data = await res.json();
    if (data.ok) {
      // Igual à página de criação que funciona
      setFamilias(data.data?.items || []);
    }
  }

  async function loadProdutos() {
    // Usar parâmetro all=true para buscar TODOS os produtos (ativos e inativos)
    // sem filtros de tabela vigente
    const res = await fetch("/api/produtos?limit=1000&all=true");
    const data = await res.json();
    if (data.ok) {
      const produtosMapeados = (data.data?.items || []).map((p: any) => ({
        ...p,
        categoriaId: p.categoria?.id || p.categoriaId,
        categoriaNome: p.categoria?.nome || "",
        familiaId: p.familia?.id || p.familiaId,
        familiaNome: p.familia?.nome || "",
        variacoes: [],
      }));
      setProdutos(produtosMapeados);
    }
  }

  async function loadVariacoesProduto(produtoId: string) {
    try {
      const res = await fetch(`/api/tabela-preco`);
      const data = await res.json();
      
      if (data.ok) {
        const linhas = data.data?.items || [];
        const medidas = linhas
          .filter((l: any) => l.produtoId === produtoId)
          .map((l: any) => ({ medida_cm: l.medida_cm }))
          .sort((a: any, b: any) => a.medida_cm - b.medida_cm);
        
        setVariacoesPorProduto((prev) => ({
          ...prev,
          [produtoId]: medidas,
        }));

        if (medidas.length > 0) {
          setVariacoesSelecionadas((prev) => {
            const newSet = new Set(medidas.map((m: any) => m.medida_cm));
            return {
              ...prev,
              [produtoId]: newSet,
            };
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar variações:", error);
    }
  }

  async function loadLinhas(q?: string, skipLoading = false) {
    if (!skipLoading) {
      setLoading(true);
    }
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
          descontoPercentual: item.descontoPercentual ? Number(item.descontoPercentual) : null,
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
      if (!skipLoading) {
        setLoading(false);
      }
    }
  }

  function getKey(produtoId: string, medida_cm: number): string {
    return `${produtoId}_${medida_cm}`;
  }

  function getFieldKey(produtoId: string, medida: number, field: string): string {
    return `${produtoId}::${medida}::${field}`;
  }

  function handleFieldChange(produtoId: string, medida_cm: number, field: keyof LinhaPreco, value: string | number) {
    const key = getKey(produtoId, medida_cm);
    const fieldKey = getFieldKey(produtoId, medida_cm, field as string);
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

    // Marcar campo específico como alterado
    dirtyRef.current.add(fieldKey);
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
      // Coletar todas as linhas que têm pelo menos um campo alterado
      const linhasComAlteracoes = new Set<string>();
      dirtyRef.current.forEach((fieldKey) => {
        const parts = fieldKey.split("::");
        if (parts.length === 3) {
          const produtoId = parts[0];
          const medida = Number(parts[1]);
          const linhaKey = getKey(produtoId, medida);
          linhasComAlteracoes.add(linhaKey);
        }
      });

      const linhasParaSalvar = linhas.filter((linha) =>
        linhasComAlteracoes.has(getKey(linha.produtoId, linha.medida_cm))
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

  function toggleCategoria(categoriaId: string) {
    const newSet = new Set(categoriasSelecionadas);
    if (newSet.has(categoriaId)) {
      newSet.delete(categoriaId);
      // Igual à página de criação que funciona
      const familiasDaCategoria = familias.filter((f: any) => f.categoriaId === categoriaId).map((f: any) => f.id);
      familiasDaCategoria.forEach((fId) => {
        familiasSelecionadas.delete(fId);
        const produtosDaFamilia = produtos.filter((p) => p.familiaId === fId).map((p) => p.id);
        produtosDaFamilia.forEach((pId) => {
          produtosSelecionados.delete(pId);
          delete variacoesSelecionadas[pId];
        });
      });
      setFamiliasSelecionadas(new Set(familiasSelecionadas));
      setProdutosSelecionados(new Set(produtosSelecionados));
      setVariacoesSelecionadas({ ...variacoesSelecionadas });
    } else {
      newSet.add(categoriaId);
    }
    setCategoriasSelecionadas(newSet);
  }

  function toggleFamilia(familiaId: string) {
    const newSet = new Set(familiasSelecionadas);
    if (newSet.has(familiaId)) {
      newSet.delete(familiaId);
      const produtosDaFamilia = produtos.filter((p) => p.familiaId === familiaId).map((p) => p.id);
      produtosDaFamilia.forEach((pId) => {
        produtosSelecionados.delete(pId);
        delete variacoesSelecionadas[pId];
      });
      setProdutosSelecionados(new Set(produtosSelecionados));
      setVariacoesSelecionadas({ ...variacoesSelecionadas });
    } else {
      newSet.add(familiaId);
    }
    setFamiliasSelecionadas(newSet);
  }

  function toggleProduto(produtoId: string) {
    const newSet = new Set(produtosSelecionados);
    if (newSet.has(produtoId)) {
      newSet.delete(produtoId);
      delete variacoesSelecionadas[produtoId];
      setVariacoesSelecionadas({ ...variacoesSelecionadas });
    } else {
      newSet.add(produtoId);
      loadVariacoesProduto(produtoId);
    }
    setProdutosSelecionados(newSet);
  }

  function toggleVariacao(produtoId: string, medida_cm: number) {
    setVariacoesSelecionadas((prev) => {
      const produtoVariacoes = prev[produtoId] || new Set<number>();
      const newSet = new Set(produtoVariacoes);
      if (newSet.has(medida_cm)) {
        newSet.delete(medida_cm);
      } else {
        newSet.add(medida_cm);
      }
      return {
        ...prev,
        [produtoId]: newSet,
      };
    });
  }

  function selecionarTodasVariacoes(produtoId: string) {
    const variacoes = variacoesPorProduto[produtoId] || [];
    setVariacoesSelecionadas((prev) => ({
      ...prev,
      [produtoId]: new Set(variacoes.map((v) => v.medida_cm)),
    }));
  }

  function deselecionarTodasVariacoes(produtoId: string) {
    setVariacoesSelecionadas((prev) => ({
      ...prev,
      [produtoId]: new Set<number>(),
    }));
  }

  function getFamiliasFiltradas() {
    let familiasFilt = familias;
    
    if (categoriasSelecionadas.size > 0) {
      // Igual à página de criação que funciona
      familiasFilt = familiasFilt.filter((f: any) => categoriasSelecionadas.has(f.categoriaId));
    }
    
    if (searchFamiliaAdd) {
      familiasFilt = familiasFilt.filter((f: any) =>
        f.nome.toLowerCase().includes(searchFamiliaAdd.toLowerCase())
      );
    }
    
    return familiasFilt;
  }

  function getProdutosFiltrados() {
    let produtosFilt = produtos;
    
    if (categoriasSelecionadas.size > 0) {
      produtosFilt = produtosFilt.filter((p) => categoriasSelecionadas.has(p.categoriaId));
    }
    
    if (familiasSelecionadas.size > 0) {
      produtosFilt = produtosFilt.filter((p) => familiasSelecionadas.has(p.familiaId));
    }
    
    if (searchProdutoAdd) {
      const searchLower = searchProdutoAdd.toLowerCase();
      produtosFilt = produtosFilt.filter((p) =>
        p.nome?.toLowerCase().includes(searchLower) ||
        p.categoriaNome?.toLowerCase().includes(searchLower) ||
        p.familiaNome?.toLowerCase().includes(searchLower)
      );
    }
    
    return produtosFilt;
  }

  async function adicionarProdutos() {
    if (produtosSelecionados.size === 0) {
      alert("Selecione pelo menos um produto para adicionar");
      return;
    }

    const totalVariacoes = Array.from(produtosSelecionados).reduce((acc, produtoId) => {
      return acc + (variacoesSelecionadas[produtoId]?.size || 0);
    }, 0);

    if (totalVariacoes === 0) {
      alert("Selecione pelo menos uma variação para adicionar");
      return;
    }

    setAdicionando(true);
    try {
      const selecoes = Array.from(produtosSelecionados).map((produtoId) => ({
        produtoId,
        medidas: Array.from(variacoesSelecionadas[produtoId] || []),
      }));

      const res = await fetch(`/api/tabelas-preco/${tabelaPrecoId}/copiar-linhas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selecoes }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        const msg = data.data.message || `${data.data.copiadas} linha(s) adicionada(s) com sucesso!`;
        alert(msg);
        setShowAddProductsModal(false);
        // Limpar seleções
        setCategoriasSelecionadas(new Set());
        setFamiliasSelecionadas(new Set());
        setProdutosSelecionados(new Set());
        setVariacoesSelecionadas({});
        setVariacoesPorProduto({});
        // Recarregar linhas
        await loadLinhas(searchQuery || undefined);
      } else {
        alert(`Erro ao adicionar produtos: ${data.error || data.details || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao adicionar produtos:", error);
      alert("Erro ao adicionar produtos. Verifique o console para mais detalhes.");
    } finally {
      setAdicionando(false);
    }
  }

  const linhasFiltradas = linhas;
  // Calcular posições sticky: w-28(7rem=112px), w-32(8rem=128px), w-48(12rem=192px), w-24(6rem=96px)
  // Considerando padding px-3 (12px cada lado) e bordas
  const columns = [
    { key: "categoriaNome", header: "Categoria", readonly: true, width: "w-28", sticky: true, stickyLeft: 0 },
    { key: "familiaNome", header: "Família", readonly: true, width: "w-32", sticky: true, stickyLeft: 112 },
    { key: "produtoNome", header: "Nome Produto", readonly: true, width: "w-48", sticky: true, stickyLeft: 240 },
    { key: "medida_cm", header: "Medida (cm)", readonly: true, width: "w-24", sticky: true, stickyLeft: 432 },
    { key: "largura_cm", header: "Largura (cm)", width: "w-28", isDimension: true },
    { key: "profundidade_cm", header: "Profundidade (cm)", width: "w-32", isDimension: true },
    { key: "altura_cm", header: "Altura (cm)", width: "w-28", isDimension: true },
    { key: "largura_assento_cm", header: "Larg. Assento (cm)", width: "w-32", isDimension: true },
    { key: "altura_assento_cm", header: "Alt. Assento (cm)", width: "w-32", isDimension: true },
    { key: "largura_braco_cm", header: "Larg. Braço (cm)", width: "w-32", isDimension: true },
    { key: "metragem_tecido_m", header: "Met. Tecido (m)", width: "w-32", isDimension: true },
    { key: "metragem_couro_m", header: "Met. Couro (m)", width: "w-32", isDimension: true },
    { key: "preco_grade_1000", header: "1000", width: "w-28", isPrice: true },
    { key: "preco_grade_2000", header: "2000", width: "w-28", isPrice: true },
    { key: "preco_grade_3000", header: "3000", width: "w-28", isPrice: true },
    { key: "preco_grade_4000", header: "4000", width: "w-28", isPrice: true },
    { key: "preco_grade_5000", header: "5000", width: "w-28", isPrice: true },
    { key: "preco_grade_6000", header: "6000", width: "w-28", isPrice: true },
    { key: "preco_grade_7000", header: "7000", width: "w-28", isPrice: true },
    { key: "preco_couro", header: "Couro", width: "w-28", isPrice: true },
    { key: "descontoPercentual", header: "Desconto (%)", width: "w-32", isDiscount: true },
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
          <button
            onClick={() => setShowAddProductsModal(true)}
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Adicionar Produtos
          </button>
        </div>
      </div>

      <AdminToolbar
        searchValue={searchInput}
        onSearchChange={setSearchInput}
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
          <div className="text-base font-medium text-gray-700 mb-4">
            Total: <span className="font-semibold text-gray-900">{linhasFiltradas.length}</span> linha(s) de preço
          </div>

          {/* Container com altura máxima e scroll sempre visível */}
          <div className="relative rounded-lg border border-gray-200 bg-white shadow-sm">
            <style dangerouslySetInnerHTML={{__html: `
              .table-scroll-wrapper::-webkit-scrollbar {
                height: 12px;
                width: 12px;
              }
              .table-scroll-wrapper::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 6px;
              }
              .table-scroll-wrapper::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 6px;
              }
              .table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}} />
            {/* Barra de rolagem horizontal sempre visível */}
            <div 
              className="table-scroll-wrapper overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)]"
              style={{ 
                scrollbarWidth: 'thin', 
                scrollbarColor: '#cbd5e1 #f1f5f9',
              }}
            >
              <table className="w-full border-collapse table-fixed min-w-max">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {columns.map((col) => {
                      const bgColor = col.isPrice ? "bg-blue-50" : col.isDimension ? "bg-green-50" : "bg-gray-50";
                      return (
                        <th
                          key={col.key}
                          className={`border-r border-gray-200 px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 last:border-r-0 ${col.width || ""} ${bgColor} ${col.sticky ? "sticky z-20" : ""}`}
                          style={col.sticky ? { left: `${col.stickyLeft}px` } : {}}
                        >
                          {col.header}
                        </th>
                      );
                    })}
                  <th className="border-r border-gray-200 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700 last:border-r-0 w-24">
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
                      const fieldKey = getFieldKey(linha.produtoId, linha.medida_cm, col.key);
                      const isFieldDirty = dirtyRef.current.has(fieldKey) && !col.isText && !col.readonly;
                      const isPrice = col.isPrice;
                      const isDimension = col.isDimension;
                      const isDiscount = col.isDiscount;

                      const bgColor = isPrice ? "bg-blue-50/30" : isDimension ? "bg-green-50/30" : isDiscount ? "bg-yellow-50/30" : "bg-white";
                      const stickyBg = col.sticky ? (isPrice ? "bg-blue-50" : isDimension ? "bg-green-50" : isDiscount ? "bg-yellow-50" : "bg-white") : "";

                      return (
                        <td 
                          key={col.key} 
                          className={`border-r border-gray-100 px-3 py-2.5 last:border-r-0 ${col.width || ""} ${bgColor} ${col.sticky ? `sticky z-10 ${stickyBg}` : ""}`}
                          style={col.sticky ? { left: `${col.stickyLeft}px` } : {}}
                        >
                          {isReadonly ? (
                            <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                          ) : (
                            <input
                              type="number"
                              step={isPrice ? "0.01" : isDimension ? "0.1" : isDiscount ? "0.01" : "1"}
                              min={isDiscount ? "0" : undefined}
                              max={isDiscount ? "100" : undefined}
                              value={value || ""}
                              onChange={(e) =>
                                handleFieldChange(linha.produtoId, linha.medida_cm, col.key as keyof LinhaPreco, e.target.value)
                              }
                              placeholder={isPrice ? "0,00" : isDimension ? "0,0" : isDiscount ? "0,00" : ""}
                              className={`w-full rounded border px-2.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                                errorClass
                                  ? "border-red-500 bg-red-100 text-red-900 focus:ring-red-500"
                                  : isFieldDirty
                                  ? "border-yellow-400 bg-yellow-50 text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                                  : isReadonly
                                  ? "border-gray-300 bg-gray-50 text-gray-900 cursor-not-allowed"
                                  : isPrice
                                  ? "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500 font-medium"
                                  : isDimension
                                  ? "border-gray-300 bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                                  : isDiscount
                                  ? "border-gray-300 bg-white text-gray-900 focus:border-yellow-500 focus:ring-yellow-500 font-medium"
                                  : "border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                              }`}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td className="border-r border-gray-100 px-3 py-2.5 last:border-r-0 w-24">
                      <button
                        onClick={() => handleDelete(linha.produtoId, linha.medida_cm)}
                        className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 whitespace-nowrap"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
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

      {/* Modal de Adicionar Produtos */}
      {showAddProductsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Adicionar Produtos à Tabela</h2>
            
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">
                Selecione as categorias, famílias, produtos e variações que deseja adicionar a esta tabela de preços.
                As linhas serão geradas a partir da tabela de preços geral (Gestão Global).
              </p>
            </div>

            {/* Seleção de Categorias */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">1. Categorias</h3>
              <input
                type="text"
                value={searchCategoriaAdd}
                onChange={(e) => setSearchCategoriaAdd(e.target.value)}
                placeholder="Buscar categoria..."
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {categorias
                  .filter((cat) => 
                    !searchCategoriaAdd || cat.nome.toLowerCase().includes(searchCategoriaAdd.toLowerCase())
                  )
                  .map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={categoriasSelecionadas.has(cat.id)}
                        onChange={() => toggleCategoria(cat.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-900">{cat.nome}</span>
                    </label>
                  ))}
              </div>
            </div>

            {/* Seleção de Famílias */}
            {categoriasSelecionadas.size > 0 && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">2. Famílias</h3>
                <input
                  type="text"
                  value={searchFamiliaAdd}
                  onChange={(e) => setSearchFamiliaAdd(e.target.value)}
                  placeholder="Buscar família..."
                  className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {getFamiliasFiltradas().length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhuma família encontrada para as categorias selecionadas</p>
                  ) : (
                    getFamiliasFiltradas().map((fam) => (
                      <label
                        key={fam.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={familiasSelecionadas.has(fam.id)}
                          onChange={() => toggleFamilia(fam.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{fam.nome}</span>
                        <span className="text-xs text-gray-500">
                          ({categorias.find((c) => c.id === fam.categoriaId)?.nome || ""})
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Seleção de Produtos */}
            {(categoriasSelecionadas.size > 0 || familiasSelecionadas.size > 0) && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-lg font-semibold text-gray-900">3. Produtos</h3>
                <input
                  type="text"
                  value={searchProdutoAdd}
                  onChange={(e) => setSearchProdutoAdd(e.target.value)}
                  placeholder="Buscar produto..."
                  className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {getProdutosFiltrados().length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum produto encontrado</p>
                  ) : (
                    getProdutosFiltrados().map((prod) => (
                      <div key={prod.id} className="rounded-lg border border-gray-200 bg-white p-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={produtosSelecionados.has(prod.id)}
                            onChange={() => toggleProduto(prod.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{prod.nome}</span>
                            <div className="text-xs text-gray-500">
                              {prod.categoriaNome} / {prod.familiaNome}
                            </div>
                          </div>
                        </label>
                        
                        {/* Variações do produto */}
                        {produtosSelecionados.has(prod.id) && variacoesPorProduto[prod.id] && (
                          <div className="mt-3 ml-7 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-700">Variações disponíveis:</span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => selecionarTodasVariacoes(prod.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Selecionar Todas
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deselecionarTodasVariacoes(prod.id)}
                                  className="text-xs text-gray-600 hover:text-gray-800"
                                >
                                  Deselecionar Todas
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {variacoesPorProduto[prod.id].map((variacao) => {
                                const isSelected = variacoesSelecionadas[prod.id]?.has(variacao.medida_cm) || false;
                                return (
                                  <label
                                    key={variacao.medida_cm}
                                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 cursor-pointer ${
                                      isSelected
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-300 bg-white hover:bg-gray-50"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleVariacao(prod.id, variacao.medida_cm)}
                                      className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-medium text-gray-900">
                                      {variacao.medida_cm}cm
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                            {variacoesPorProduto[prod.id].length === 0 && (
                              <p className="text-xs text-gray-500">Nenhuma variação encontrada na tabela geral</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-3 text-sm font-medium text-gray-700">
                  {produtosSelecionados.size} produto(s) selecionado(s)
                </div>
              </div>
            )}

            {/* Botões do Modal */}
            <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                onClick={() => {
                  setShowAddProductsModal(false);
                  setCategoriasSelecionadas(new Set());
                  setFamiliasSelecionadas(new Set());
                  setProdutosSelecionados(new Set());
                  setVariacoesSelecionadas({});
                  setVariacoesPorProduto({});
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={adicionarProdutos}
                disabled={adicionando || produtosSelecionados.size === 0}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {adicionando ? "Adicionando..." : "Adicionar Produtos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


