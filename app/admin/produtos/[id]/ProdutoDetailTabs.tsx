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
      <div className="mb-4 border-b">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => switchTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium ${
                currentTab === tab.key
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500 hover:text-gray-700"
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

