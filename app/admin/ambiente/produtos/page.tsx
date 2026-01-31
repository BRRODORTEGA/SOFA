"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

type Ambiente = { id: string; nome: string };
type ProdutoItem = { id: string; nome: string; familia?: { nome: string } };

export default function AmbienteProdutosPage() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>("");
  const [produtosNoAmbiente, setProdutosNoAmbiente] = useState<ProdutoItem[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<ProdutoItem[]>([]);
  const [selectedDisponiveis, setSelectedDisponiveis] = useState<string[]>([]);
  const [selectedNoAmbiente, setSelectedNoAmbiente] = useState<string[]>([]);
  const [filtroDisponiveis, setFiltroDisponiveis] = useState("");
  const [filtroNoAmbiente, setFiltroNoAmbiente] = useState("");
  const [loadingAmbientes, setLoadingAmbientes] = useState(true);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [loadingLista, setLoadingLista] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAmbientes = useCallback(async () => {
    setLoadingAmbientes(true);
    try {
      const res = await fetch("/api/ambientes?limit=200");
      const data = await res.json();
      if (data?.ok && data?.data?.items) {
        setAmbientes(data.data.items);
        if (data.data.items.length > 0 && !selectedAmbienteId) {
          setSelectedAmbienteId(data.data.items[0].id);
        }
      }
    } finally {
      setLoadingAmbientes(false);
    }
  }, []);

  const loadProdutosAmbiente = useCallback(async (ambienteId: string) => {
    if (!ambienteId) {
      setProdutosNoAmbiente([]);
      return;
    }
    setLoadingLista(true);
    try {
      const res = await fetch(`/api/ambientes/${ambienteId}/produtos`);
      const data = await res.json();
      if (data?.ok && data?.data?.items) {
        setProdutosNoAmbiente(data.data.items);
      } else {
        setProdutosNoAmbiente([]);
      }
    } finally {
      setLoadingLista(false);
    }
  }, []);

  const loadTodosProdutos = useCallback(async () => {
    setLoadingProdutos(true);
    try {
      const res = await fetch("/api/produtos?all=true&limit=500");
      const data = await res.json();
      if (data?.ok && data?.data?.items) {
        setTodosProdutos(data.data.items);
      } else {
        setTodosProdutos([]);
      }
    } finally {
      setLoadingProdutos(false);
    }
  }, []);

  useEffect(() => {
    loadAmbientes();
  }, [loadAmbientes]);

  useEffect(() => {
    if (selectedAmbienteId) {
      loadProdutosAmbiente(selectedAmbienteId);
    } else {
      setProdutosNoAmbiente([]);
    }
  }, [selectedAmbienteId, loadProdutosAmbiente]);

  useEffect(() => {
    if (selectedAmbienteId) {
      loadTodosProdutos();
    }
  }, [selectedAmbienteId, loadTodosProdutos]);

  const produtosDisponiveis = useMemo(
    () => todosProdutos.filter((p) => !produtosNoAmbiente.some((pa) => pa.id === p.id)),
    [todosProdutos, produtosNoAmbiente]
  );

  const disponiveisFiltrados = useMemo(() => {
    if (!filtroDisponiveis.trim()) return produtosDisponiveis;
    const q = filtroDisponiveis.toLowerCase().trim();
    return produtosDisponiveis.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.familia?.nome?.toLowerCase().includes(q) ?? false)
    );
  }, [produtosDisponiveis, filtroDisponiveis]);

  const noAmbienteFiltrados = useMemo(() => {
    if (!filtroNoAmbiente.trim()) return produtosNoAmbiente;
    const q = filtroNoAmbiente.toLowerCase().trim();
    return produtosNoAmbiente.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.familia?.nome?.toLowerCase().includes(q) ?? false)
    );
  }, [produtosNoAmbiente, filtroNoAmbiente]);

  const toggleDisponivel = (id: string) => {
    setSelectedDisponiveis((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleNoAmbiente = (id: string) => {
    setSelectedNoAmbiente((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selecionarTodosDisponiveis = () => {
    setSelectedDisponiveis(disponiveisFiltrados.map((p) => p.id));
  };

  const limparDisponiveis = () => {
    setSelectedDisponiveis([]);
  };

  const selecionarTodosNoAmbiente = () => {
    setSelectedNoAmbiente(noAmbienteFiltrados.map((p) => p.id));
  };

  const limparNoAmbiente = () => {
    setSelectedNoAmbiente([]);
  };

  async function handleAdicionar() {
    if (!selectedAmbienteId || selectedDisponiveis.length === 0) return;
    setSaving(true);
    try {
      let okCount = 0;
      for (const produtoId of selectedDisponiveis) {
        const res = await fetch(`/api/ambientes/${selectedAmbienteId}/produtos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ produtoId }),
        });
        const data = await res.json();
        if (res.ok && data?.ok) okCount++;
      }
      setSelectedDisponiveis([]);
      await loadProdutosAmbiente(selectedAmbienteId);
      if (okCount < selectedDisponiveis.length) {
        alert(`Adicionados ${okCount} de ${selectedDisponiveis.length} produto(s).`);
      }
    } catch (e) {
      alert("Erro ao adicionar produtos. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemover() {
    if (!selectedAmbienteId || selectedNoAmbiente.length === 0) return;
    if (!confirm(`Remover ${selectedNoAmbiente.length} produto(s) deste ambiente?`)) return;
    setSaving(true);
    try {
      let okCount = 0;
      for (const produtoId of selectedNoAmbiente) {
        const res = await fetch(
          `/api/ambientes/${selectedAmbienteId}/produtos?produtoId=${encodeURIComponent(produtoId)}`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (res.ok && data?.ok) okCount++;
      }
      setSelectedNoAmbiente([]);
      await loadProdutosAmbiente(selectedAmbienteId);
      if (okCount < selectedNoAmbiente.length) {
        alert(`Removidos ${okCount} de ${selectedNoAmbiente.length} produto(s).`);
      }
    } catch (e) {
      alert("Erro ao remover produtos. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const selectedAmbiente = ambientes.find((a) => a.id === selectedAmbienteId);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Produtos por Ambiente</h1>
      <p className="mb-6 text-gray-600">
        Selecione um ambiente e mova os produtos entre &quot;Disponíveis&quot; e &quot;Neste ambiente&quot; usando os botões ao centro.
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-gray-700">Ambiente</label>
          <select
            value={selectedAmbienteId}
            onChange={(e) => {
              setSelectedAmbienteId(e.target.value);
              setSelectedDisponiveis([]);
              setSelectedNoAmbiente([]);
            }}
            disabled={loadingAmbientes}
            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Selecione um ambiente</option>
            {ambientes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          {ambientes.length === 0 && !loadingAmbientes && (
            <p className="mt-2 text-sm text-amber-700">
              Nenhum ambiente cadastrado.{" "}
              <Link href="/admin/ambiente/new" className="font-medium text-blue-600 hover:underline">
                Criar ambiente
              </Link>
            </p>
          )}
        </div>

        {selectedAmbienteId && (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            {/* Lista esquerda: Produtos disponíveis */}
            <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-gray-50/50">
              <div className="border-b border-gray-200 px-3 py-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  Produtos disponíveis ({disponiveisFiltrados.length})
                </h2>
                <input
                  type="text"
                  placeholder="Filtrar por nome ou família..."
                  value={filtroDisponiveis}
                  onChange={(e) => setFiltroDisponiveis(e.target.value)}
                  className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={selecionarTodosDisponiveis}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={limparDisponiveis}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>
              <div className="min-h-[280px] max-h-[400px] overflow-y-auto p-2">
                {loadingProdutos ? (
                  <p className="py-4 text-center text-sm text-gray-500">Carregando...</p>
                ) : disponiveisFiltrados.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    {produtosDisponiveis.length === 0
                      ? "Todos os produtos já estão neste ambiente."
                      : "Nenhum resultado para o filtro."}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {disponiveisFiltrados.map((p) => (
                      <li key={p.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={selectedDisponiveis.includes(p.id)}
                            onChange={() => toggleDisponivel(p.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-900">
                            {p.nome}
                            {p.familia?.nome && (
                              <span className="text-gray-500"> ({p.familia.nome})</span>
                            )}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Botões do meio */}
            <div className="flex flex-row items-center justify-center gap-2 lg:flex-col lg:justify-center lg:py-8">
              <button
                type="button"
                onClick={handleAdicionar}
                disabled={selectedDisponiveis.length === 0 || saving}
                className="rounded-lg border-2 border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:border-gray-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Adicionar &gt;&gt;
              </button>
              <button
                type="button"
                onClick={handleRemover}
                disabled={selectedNoAmbiente.length === 0 || saving}
                className="rounded-lg border-2 border-gray-400 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                &lt;&lt; Remover
              </button>
              {saving && (
                <span className="text-xs text-gray-500">Salvando...</span>
              )}
            </div>

            {/* Lista direita: Produtos neste ambiente */}
            <div className="flex flex-1 flex-col rounded-lg border border-gray-200 bg-gray-50/50">
              <div className="border-b border-gray-200 px-3 py-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  Produtos neste ambiente ({noAmbienteFiltrados.length})
                </h2>
                <input
                  type="text"
                  placeholder="Filtrar por nome ou família..."
                  value={filtroNoAmbiente}
                  onChange={(e) => setFiltroNoAmbiente(e.target.value)}
                  className="mt-2 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={selecionarTodosNoAmbiente}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Marcar todos
                  </button>
                  <button
                    type="button"
                    onClick={limparNoAmbiente}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    Desmarcar
                  </button>
                </div>
              </div>
              <div className="min-h-[280px] max-h-[400px] overflow-y-auto p-2">
                {loadingLista ? (
                  <p className="py-4 text-center text-sm text-gray-500">Carregando...</p>
                ) : noAmbienteFiltrados.length === 0 ? (
                  <p className="py-4 text-center text-sm text-gray-500">
                    Nenhum produto vinculado. Selecione à esquerda e clique em &quot;Adicionar &gt;&gt;&quot;.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {noAmbienteFiltrados.map((p) => (
                      <li key={p.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={selectedNoAmbiente.includes(p.id)}
                            onChange={() => toggleNoAmbiente(p.id)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-900">
                            {p.nome}
                            {p.familia?.nome && (
                              <span className="text-gray-500"> ({p.familia.nome})</span>
                            )}
                          </span>
                          <Link
                            href={`/admin/produtos/${p.id}`}
                            target="_blank"
                            className="ml-auto text-xs text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver
                          </Link>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
