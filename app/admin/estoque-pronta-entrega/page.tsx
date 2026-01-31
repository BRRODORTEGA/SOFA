"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface CelulaEstoque {
  produtoId: string;
  produtoNome: string;
  categoriaId: string;
  categoriaNome: string;
  familiaId: string;
  familiaNome: string;
  variacaoId: string;
  medida_cm: number;
  tecidoId: string;
  tecidoNome: string;
  quantidade: number;
}

type TreeCategoria = {
  id: string;
  nome: string;
  familias: TreeFamilia[];
};

type TreeFamilia = {
  id: string;
  nome: string;
  produtos: TreeProduto[];
};

type TreeProduto = {
  id: string;
  nome: string;
  celulas: CelulaEstoque[];
};

type CatMapVal = {
  nome: string;
  famMap: Map<string, { nome: string; prodMap: Map<string, { nome: string; celulas: CelulaEstoque[] }> }>;
};

function buildTree(items: CelulaEstoque[]): TreeCategoria[] {
  const catMap = new Map<string, CatMapVal>();
  for (const c of items) {
    if (!catMap.has(c.categoriaId)) {
      catMap.set(c.categoriaId, { nome: c.categoriaNome, famMap: new Map() });
    }
    const cat = catMap.get(c.categoriaId)!;
    if (!cat.famMap.has(c.familiaId)) {
      cat.famMap.set(c.familiaId, { nome: c.familiaNome, prodMap: new Map() });
    }
    const fam = cat.famMap.get(c.familiaId)!;
    if (!fam.prodMap.has(c.produtoId)) {
      fam.prodMap.set(c.produtoId, { nome: c.produtoNome, celulas: [] });
    }
    fam.prodMap.get(c.produtoId)!.celulas.push(c);
  }
  const categorias: TreeCategoria[] = [];
  catMap.forEach((cat, catId) => {
    const familias: TreeFamilia[] = [];
    cat.famMap.forEach((fam, famId) => {
      const produtos: TreeProduto[] = [];
      fam.prodMap.forEach((prod, prodId) => {
        produtos.push({ id: prodId, nome: prod.nome, celulas: prod.celulas });
      });
      produtos.sort((a, b) => a.nome.localeCompare(b.nome));
      familias.push({ id: famId, nome: fam.nome, produtos });
    });
    familias.sort((a, b) => a.nome.localeCompare(b.nome));
    categorias.push({ id: catId, nome: cat.nome, familias });
  });
  categorias.sort((a, b) => a.nome.localeCompare(b.nome));
  return categorias;
}

export default function EstoqueProntaEntregaPage() {
  const [items, setItems] = useState<CelulaEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("");
  const [expandedCategorias, setExpandedCategorias] = useState<Set<string>>(new Set());
  const [expandedFamilias, setExpandedFamilias] = useState<Set<string>>(new Set());
  const [expandedProdutos, setExpandedProdutos] = useState<Set<string>>(new Set());

  const loadEstoque = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/estoque-pronta-entrega");
      const data = await res.json();
      if (!data.ok || !data.data?.items) {
        setError("Não foi possível carregar o estoque.");
        setItems([]);
        return;
      }
      setItems(data.data.items);
    } catch {
      setError("Erro ao carregar o estoque.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstoque();
  }, [loadEstoque]);

  const updateQuantidade = useCallback(
    async (variacaoId: string, tecidoId: string, valor: number) => {
      const key = `${variacaoId}:${tecidoId}`;
      setSavingKey(key);
      try {
        const res = await fetch("/api/estoque-pronta-entrega", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variacaoId,
            tecidoId,
            quantidade: valor,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data?.error || "Erro ao salvar");
        }
        setItems((prev) =>
          prev.map((c) =>
            c.variacaoId === variacaoId && c.tecidoId === tecidoId
              ? { ...c, quantidade: valor }
              : c
          )
        );
      } catch (e: any) {
        alert(e?.message || "Erro ao salvar estoque.");
      } finally {
        setSavingKey(null);
      }
    },
    []
  );

  const handleQuantidadeChange = useCallback(
    (variacaoId: string, tecidoId: string, value: string) => {
      const num =
        value.trim() === "" ? 0 : Math.max(0, parseInt(value, 10) || 0);
      setItems((prev) =>
        prev.map((c) =>
          c.variacaoId === variacaoId && c.tecidoId === tecidoId
            ? { ...c, quantidade: num }
            : c
        )
      );
    },
    []
  );

  const handleQuantidadeBlur = useCallback(
    (c: CelulaEstoque, currentValue: number) => {
      updateQuantidade(c.variacaoId, c.tecidoId, currentValue);
    },
    [updateQuantidade]
  );

  const itensFiltrados = useMemo(() => {
    if (!filtro.trim()) return items;
    const q = filtro.toLowerCase();
    return items.filter(
      (c) =>
        c.produtoNome.toLowerCase().includes(q) ||
        c.categoriaNome.toLowerCase().includes(q) ||
        c.familiaNome.toLowerCase().includes(q)
    );
  }, [items, filtro]);

  const tree = useMemo(() => buildTree(itensFiltrados), [itensFiltrados]);

  const toggleCategoria = (id: string) => {
    setExpandedCategorias((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFamilia = (id: string) => {
    setExpandedFamilias((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleProduto = (id: string) => {
    setExpandedProdutos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const catIds = new Set(tree.map((c) => c.id));
    const famIds = new Set<string>();
    const prodIds = new Set<string>();
    tree.forEach((cat) => {
      cat.familias.forEach((f) => {
        famIds.add(f.id);
        f.produtos.forEach((p) => prodIds.add(p.id));
      });
    });
    setExpandedCategorias(catIds);
    setExpandedFamilias(famIds);
    setExpandedProdutos(prodIds);
  };

  const collapseAll = () => {
    setExpandedCategorias(new Set());
    setExpandedFamilias(new Set());
    setExpandedProdutos(new Set());
  };

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Estoque Pronta Entrega
      </h1>
      <p className="mb-6 text-gray-600">
        Gestão de estoque por categoria, família, produto, medida e tecido.
        Expanda os níveis para ver e editar as quantidades.
      </p>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
          Nenhum produto com variações e tecidos cadastrados. Cadastre variações
          (medidas) e tecidos nos produtos para gerenciar o estoque aqui.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Filtrar por categoria, família ou produto..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="flex-1 min-w-[200px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={expandAll}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Expandir tudo
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Recolher tudo
            </button>
          </div>

          <div className="space-y-1 rounded-lg border border-gray-200 bg-white shadow">
            {tree.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhum resultado para &quot;{filtro}&quot;
              </div>
            ) : (
              tree.map((cat) => {
                const catOpen = expandedCategorias.has(cat.id);
                const totalCelulasCat = cat.familias.reduce(
                  (s, f) =>
                    s + f.produtos.reduce((s2, p) => s2 + p.celulas.length, 0),
                  0
                );
                return (
                  <div
                    key={cat.id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCategoria(cat.id)}
                      className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-gray-50"
                    >
                      <span
                        className={`inline-block w-5 text-gray-500 transition-transform ${catOpen ? "rotate-90" : ""}`}
                      >
                        ▶
                      </span>
                      <span className="font-semibold text-gray-900">
                        {cat.nome}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({cat.familias.length} família
                        {cat.familias.length !== 1 ? "s" : ""}, {totalCelulasCat} combinações)
                      </span>
                    </button>
                    {catOpen && (
                      <div className="border-t border-gray-100 bg-gray-50/50 pl-4">
                        {cat.familias.map((fam) => {
                          const famOpen = expandedFamilias.has(fam.id);
                          const totalCelulasFam = fam.produtos.reduce(
                            (s, p) => s + p.celulas.length,
                            0
                          );
                          return (
                            <div
                              key={fam.id}
                              className="border-b border-gray-100 last:border-b-0"
                            >
                              <button
                                type="button"
                                onClick={() => toggleFamilia(fam.id)}
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-100/80"
                              >
                                <span
                                  className={`inline-block w-5 text-gray-500 transition-transform ${famOpen ? "rotate-90" : ""}`}
                                >
                                  ▶
                                </span>
                                <span className="font-medium text-gray-800">
                                  {fam.nome}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({fam.produtos.length} produto
                                  {fam.produtos.length !== 1 ? "s" : ""}, {totalCelulasFam} combinações)
                                </span>
                              </button>
                              {famOpen && (
                                <div className="border-t border-gray-100 bg-white pl-4">
                                  {fam.produtos.map((prod) => {
                                    const prodOpen = expandedProdutos.has(
                                      prod.id
                                    );
                                    return (
                                      <div
                                        key={prod.id}
                                        className="border-b border-gray-100 last:border-b-0"
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleProduto(prod.id)
                                          }
                                          className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
                                        >
                                          <span
                                            className={`inline-block w-5 text-gray-400 transition-transform ${prodOpen ? "rotate-90" : ""}`}
                                          >
                                            ▶
                                          </span>
                                          <Link
                                            href={`/admin/produtos/${prod.id}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="font-medium text-blue-600 hover:underline"
                                          >
                                            {prod.nome}
                                          </Link>
                                          <span className="text-sm text-gray-500">
                                            ({prod.celulas.length} combinações
                                            medida × tecido)
                                          </span>
                                        </button>
                                        {prodOpen && (
                                          <div className="overflow-x-auto border-t border-gray-100 bg-gray-50/30 px-4 pb-3 pt-2">
                                            <table className="min-w-full text-sm">
                                              <thead>
                                                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
                                                  <th className="py-2 pr-4">
                                                    Medida (cm)
                                                  </th>
                                                  <th className="py-2 pr-4">
                                                    Tecido
                                                  </th>
                                                  <th className="py-2">
                                                    Estoque
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {prod.celulas.map((c) => {
                                                  const key = `${c.variacaoId}:${c.tecidoId}`;
                                                  return (
                                                    <tr
                                                      key={key}
                                                      className="border-b border-gray-100 last:border-b-0"
                                                    >
                                                      <td className="py-2 pr-4 text-gray-700">
                                                        {c.medida_cm}
                                                      </td>
                                                      <td className="py-2 pr-4 text-gray-700">
                                                        {c.tecidoNome}
                                                      </td>
                                                      <td className="py-2">
                                                        <div className="flex items-center gap-2">
                                                          <input
                                                            type="number"
                                                            min={0}
                                                            value={
                                                              c.quantidade === 0
                                                                ? ""
                                                                : c.quantidade
                                                            }
                                                            onChange={(e) =>
                                                              handleQuantidadeChange(
                                                                c.variacaoId,
                                                                c.tecidoId,
                                                                e.target.value
                                                              )
                                                            }
                                                            onBlur={() =>
                                                              handleQuantidadeBlur(
                                                                c,
                                                                c.quantidade
                                                              )
                                                            }
                                                            className="w-20 rounded border border-gray-300 px-2 py-1.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            placeholder="0"
                                                          />
                                                          {savingKey === key && (
                                                            <span className="text-xs text-gray-400">
                                                              Salvando...
                                                            </span>
                                                          )}
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Total:{" "}
            <span className="font-medium text-gray-700">
              {itensFiltrados.length}
            </span>{" "}
            combinação(ões). O estoque é salvo ao sair do campo.
          </p>
        </>
      )}
    </div>
  );
}
