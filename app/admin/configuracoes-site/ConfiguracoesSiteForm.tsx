"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Categoria {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  categoria: { nome: string };
  familia: { nome: string };
}

interface TabelaPreco {
  id: string;
  nome: string;
  descricao: string | null;
}

interface SiteConfig {
  id: string;
  categoriasDestaque: string[];
  produtosDestaque: string[];
  tabelaPrecoVigenteId: string | null;
  ordemCategorias: string[];
  tabelaPrecoVigente: TabelaPreco | null;
}

interface Props {
  siteConfig: SiteConfig;
  categorias: Categoria[];
  produtos: Produto[];
  tabelasPreco: TabelaPreco[];
}

export default function ConfiguracoesSiteForm({
  siteConfig,
  categorias,
  produtos,
  tabelasPreco,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>(
    siteConfig.categoriasDestaque || []
  );
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>(
    siteConfig.produtosDestaque || []
  );
  const [tabelaPrecoSelecionada, setTabelaPrecoSelecionada] = useState<string>(
    siteConfig.tabelaPrecoVigenteId || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/configuracoes-site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoriasDestaque: categoriasSelecionadas,
          produtosDestaque: produtosSelecionados,
          tabelaPrecoVigenteId: tabelaPrecoSelecionada || null,
          ordemCategorias: categoriasSelecionadas, // Por enquanto, ordem = ordem de seleção
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar configurações");
      }

      router.refresh();
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar configurações. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoria = (categoriaId: string) => {
    setCategoriasSelecionadas((prev) =>
      prev.includes(categoriaId)
        ? prev.filter((id) => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  const toggleProduto = (produtoId: string) => {
    setProdutosSelecionados((prev) =>
      prev.includes(produtoId)
        ? prev.filter((id) => id !== produtoId)
        : [...prev, produtoId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção: Categorias em Destaque */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Categorias em Destaque
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Selecione as categorias que aparecerão na página inicial do site
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categorias.map((categoria) => {
            const isSelected = categoriasSelecionadas.includes(categoria.id);
            return (
              <label
                key={categoria.id}
                className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategoria(categoria.id)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  {categoria.nome}
                </span>
              </label>
            );
          })}
        </div>
        {categoriasSelecionadas.length > 0 && (
          <p className="mt-4 text-sm text-gray-500">
            {categoriasSelecionadas.length} categoria(s) selecionada(s)
          </p>
        )}
      </div>

      {/* Seção: Produtos em Destaque */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Produtos em Destaque
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Selecione os produtos que aparecerão na seção "Produtos em Destaque" da página inicial
        </p>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {produtos.map((produto) => {
            const isSelected = produtosSelecionados.includes(produto.id);
            return (
              <label
                key={produto.id}
                className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleProduto(produto.id)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    {produto.nome}
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    {produto.categoria.nome} / {produto.familia.nome}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
        {produtosSelecionados.length > 0 && (
          <p className="mt-4 text-sm text-gray-500">
            {produtosSelecionados.length} produto(s) selecionado(s)
          </p>
        )}
      </div>

      {/* Seção: Tabela de Preço Vigente */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Tabela de Preço Vigente
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Selecione qual tabela de preço está ativa no momento para exibição no site
        </p>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300">
            <input
              type="radio"
              name="tabelaPreco"
              value=""
              checked={tabelaPrecoSelecionada === ""}
              onChange={(e) => setTabelaPrecoSelecionada(e.target.value)}
              className="mr-3 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                Nenhuma (usar padrão)
              </span>
            </div>
          </label>
          {tabelasPreco.map((tabela) => (
            <label
              key={tabela.id}
              className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                tabelaPrecoSelecionada === tabela.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="tabelaPreco"
                value={tabela.id}
                checked={tabelaPrecoSelecionada === tabela.id}
                onChange={(e) => setTabelaPrecoSelecionada(e.target.value)}
                className="mr-3 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {tabela.nome}
                </span>
                {tabela.descricao && (
                  <p className="mt-1 text-xs text-gray-500">{tabela.descricao}</p>
                )}
              </div>
            </label>
          ))}
        </div>
        {tabelaPrecoSelecionada && (
          <p className="mt-4 text-sm text-gray-500">
            Tabela selecionada:{" "}
            {tabelasPreco.find((t) => t.id === tabelaPrecoSelecionada)?.nome}
          </p>
        )}
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </form>
  );
}

