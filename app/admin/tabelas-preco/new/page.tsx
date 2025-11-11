"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tabelaPrecoSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";

type ProdutoComVariacoes = {
  id: string;
  nome: string;
  categoriaId: string;
  categoriaNome: string;
  familiaId: string;
  familiaNome: string;
  variacoes: Array<{ medida_cm: number }>;
};

type SelecaoVariacoes = {
  [produtoId: string]: Set<number>; // produtoId -> Set de medidas selecionadas
};

export default function NewTabelaPrecoPage() {
  const router = useRouter();
  const [step, setStep] = useState<"dados" | "produtos">("dados");
  const [tabelaId, setTabelaId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<ProdutoComVariacoes[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<Set<string>>(new Set());
  const [familiasSelecionadas, setFamiliasSelecionadas] = useState<Set<string>>(new Set());
  const [produtosSelecionados, setProdutosSelecionados] = useState<Set<string>>(new Set());
  const [variacoesSelecionadas, setVariacoesSelecionadas] = useState<SelecaoVariacoes>({});
  const [variacoesPorProduto, setVariacoesPorProduto] = useState<{ [produtoId: string]: Array<{ medida_cm: number }> }>({});
  const [copiando, setCopiando] = useState(false);
  const [searchCategoria, setSearchCategoria] = useState("");
  const [searchFamilia, setSearchFamilia] = useState("");
  const [searchProduto, setSearchProduto] = useState("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(tabelaPrecoSchema),
    defaultValues: { ativo: true },
  });

  useEffect(() => {
    loadCategorias();
    loadFamilias();
    loadProdutos();
  }, []);

  // Carregar variações quando um produto é selecionado
  useEffect(() => {
    produtosSelecionados.forEach(async (produtoId) => {
      if (!variacoesPorProduto[produtoId]) {
        await loadVariacoesProduto(produtoId);
      }
    });
  }, [produtosSelecionados]);

  async function loadCategorias() {
    const res = await fetch("/api/categorias");
    const data = await res.json();
    if (data.ok) setCategorias(data.data?.items || []);
  }

  async function loadFamilias() {
    const res = await fetch("/api/familias");
    const data = await res.json();
    if (data.ok) setFamilias(data.data?.items || []);
  }

  async function loadProdutos() {
    const res = await fetch("/api/produtos?limit=1000");
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
      // Buscar linhas da tabela geral para este produto específico
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

        // Inicializar seleção com todas as variações
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

  async function onSubmit(values: any) {
    try {
      const res = await fetch("/api/tabelas-preco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      
      const data = await res.json();
      
      if (res.ok && data.ok) {
        setTabelaId(data.data.item.id);
        setStep("produtos");
      } else {
        alert(`Erro ao criar: ${data.error || data.details || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao criar tabela de preços:", error);
      alert("Erro ao criar. Verifique o console para mais detalhes.");
    }
  }

  function toggleCategoria(categoriaId: string) {
    const newSet = new Set(categoriasSelecionadas);
    if (newSet.has(categoriaId)) {
      newSet.delete(categoriaId);
      // Remover famílias, produtos e variações dessa categoria
      const familiasDaCategoria = familias.filter((f) => f.categoriaId === categoriaId).map((f) => f.id);
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
      // Remover produtos e variações dessa família
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
      // Carregar variações do produto
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
      familiasFilt = familiasFilt.filter((f) => categoriasSelecionadas.has(f.categoriaId));
    }
    
    if (searchFamilia) {
      familiasFilt = familiasFilt.filter((f) =>
        f.nome.toLowerCase().includes(searchFamilia.toLowerCase())
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
    
    if (searchProduto) {
      const searchLower = searchProduto.toLowerCase();
      produtosFilt = produtosFilt.filter((p) =>
        p.nome?.toLowerCase().includes(searchLower) ||
        p.categoriaNome?.toLowerCase().includes(searchLower) ||
        p.familiaNome?.toLowerCase().includes(searchLower)
      );
    }
    
    return produtosFilt;
  }

  async function copiarLinhas() {
    if (!tabelaId || produtosSelecionados.size === 0) {
      alert("Selecione pelo menos um produto para gerar a tabela");
      return;
    }

    // Verificar se há variações selecionadas
    const totalVariacoes = Array.from(produtosSelecionados).reduce((acc, produtoId) => {
      return acc + (variacoesSelecionadas[produtoId]?.size || 0);
    }, 0);

    if (totalVariacoes === 0) {
      alert("Selecione pelo menos uma variação para gerar a tabela");
      return;
    }

    setCopiando(true);
    try {
      // Preparar dados: produtoId + medidas selecionadas
      const selecoes = Array.from(produtosSelecionados).map((produtoId) => ({
        produtoId,
        medidas: Array.from(variacoesSelecionadas[produtoId] || []),
      }));

      const res = await fetch(`/api/tabelas-preco/${tabelaId}/copiar-linhas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selecoes }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        const msg = data.data.message || `${data.data.copiadas} linha(s) gerada(s) com sucesso!`;
        alert(msg);
        // Aguardar um pouco antes de redirecionar para garantir que os dados foram salvos
        await new Promise(resolve => setTimeout(resolve, 500));
        // Redirecionar e forçar reload
        window.location.href = `/admin/tabelas-preco/${tabelaId}?tab=precos`;
      } else {
        alert(`Erro ao gerar tabela: ${data.error || data.details || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao copiar linhas:", error);
      alert("Erro ao copiar linhas. Verifique o console para mais detalhes.");
    } finally {
      setCopiando(false);
    }
  }

  const categoriasFiltradas = searchCategoria
    ? categorias.filter((c) => c.nome.toLowerCase().includes(searchCategoria.toLowerCase()))
    : categorias;
  
  const familiasFiltradas = getFamiliasFiltradas();
  const produtosFiltrados = getProdutosFiltrados();

  if (step === "produtos") {
    return (
      <FormShell
        title="Selecionar Produtos e Variações"
        actions={
          <>
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              onClick={() => setStep("dados")}
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={copiarLinhas}
              disabled={copiando || produtosSelecionados.size === 0}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {copiando ? "Gerando..." : "Gerar Tabela de Preço"}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              Selecione as categorias, famílias, produtos e variações que farão parte desta tabela de preços.
              As linhas serão geradas a partir da tabela de preços geral (Gestão Global).
            </p>
          </div>

          {/* Seleção de Categorias */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">1. Categorias</h3>
            <input
              type="text"
              value={searchCategoria}
              onChange={(e) => setSearchCategoria(e.target.value)}
              placeholder="Buscar categoria..."
              className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {categoriasFiltradas.map((cat) => (
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
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">2. Famílias</h3>
              <input
                type="text"
                value={searchFamilia}
                onChange={(e) => setSearchFamilia(e.target.value)}
                placeholder="Buscar família..."
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {familiasFiltradas.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma família encontrada para as categorias selecionadas</p>
                ) : (
                  familiasFiltradas.map((fam) => (
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
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">3. Produtos</h3>
              <input
                type="text"
                value={searchProduto}
                onChange={(e) => setSearchProduto(e.target.value)}
                placeholder="Buscar produto..."
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {produtosFiltrados.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum produto encontrado</p>
                ) : (
                  produtosFiltrados.map((prod) => (
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
                      
                      {/* Variações do produto (mostrar apenas se produto estiver selecionado) */}
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
        </div>
      </FormShell>
    );
  }

  return (
    <FormShell
      title="Nova Tabela de Preços"
      actions={
        <>
          <button
            type="button"
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            onClick={() => router.back()}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            form="tabela-preco-form"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="tabela-preco-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
          <input
            {...register("nome")}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Tabela de Preços 2024"
          />
          {errors.nome && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição (opcional)</label>
          <textarea
            {...register("descricao")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descrição da tabela de preços..."
          />
          {errors.descricao && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.descricao.message)}</p>}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="ativo"
            {...register("ativo", { setValueAs: (value) => Boolean(value) })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="ativo" className="text-sm font-medium text-gray-700">Ativo</label>
        </div>
      </form>
    </FormShell>
  );
}
