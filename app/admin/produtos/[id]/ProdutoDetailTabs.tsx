"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EditProduto from "./ui-edit";
import ProdutoTecidosTab from "./ProdutoTecidosTab";
import ProdutoVariacoesTab from "./ProdutoVariacoesTab";
import ProdutoTabelaPrecoTab from "./ProdutoTabelaPrecoTab";

const tabs = [
  { key: "dados", label: "Dados" },
  { key: "tecidos", label: "Tecidos" },
  { key: "variacoes", label: "Variações" },
  { key: "precos", label: "Preços" },
];

export default function ProdutoDetailTabs({ produto, activeTab }: { produto: any; activeTab: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState(activeTab);

  useEffect(() => {
    const tab = searchParams.get("tab") || "dados";
    setCurrentTab(tab);
  }, [searchParams]);

  function switchTab(tab: string) {
    setCurrentTab(tab);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("tab", tab);
    router.push(`?${params.toString()}`);
  }

  return (
    <div>
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`px-6 py-3 text-sm font-semibold transition-colors ${
                currentTab === tab.key
                  ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {currentTab === "dados" && <EditProduto item={produto} />}
      {currentTab === "tecidos" && <ProdutoTecidosTab produtoId={produto.id} />}
      {currentTab === "variacoes" && <ProdutoVariacoesTab produtoId={produto.id} />}
      {currentTab === "precos" && <ProdutoTabelaPrecoTab produtoId={produto.id} />}
    </div>
  );
}

