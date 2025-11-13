"use client";

import { useState, useEffect, useRef } from "react";
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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const pendingTabChangeRef = useRef<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab") || "dados";
    setCurrentTab(tab);
  }, [searchParams]);

  // Escutar eventos de alterações não salvas das abas de preços e variações
  useEffect(() => {
    const handleUnsavedChangesState = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.produtoId === produto.id) {
        const tabFromEvent = customEvent.detail.tab;
        const newHasUnsavedChanges = customEvent.detail.hasUnsavedChanges;
        
        // Se o evento vem da aba atual, sempre atualizar
        // Se o evento indica que não há alterações (false), sempre atualizar para limpar o estado
        // Se o evento vem de outra aba mas indica que há alterações, só atualizar se não tivermos alterações pendentes
        if (tabFromEvent === currentTab || !newHasUnsavedChanges || !hasUnsavedChanges) {
          setHasUnsavedChanges(newHasUnsavedChanges);
        }
      }
    };

    window.addEventListener("unsavedChangesState", handleUnsavedChangesState);
    return () => window.removeEventListener("unsavedChangesState", handleUnsavedChangesState);
  }, [produto.id, currentTab, hasUnsavedChanges]);

  async function switchTab(tab: string) {
    // Se já está na mesma aba, não fazer nada
    if (tab === currentTab) return;

    // Se há alterações não salvas e está saindo da aba de preços ou variações
    if (hasUnsavedChanges && (currentTab === "precos" || currentTab === "variacoes")) {
      // Perguntar ao usuário com opções mais claras
      const abaNome = currentTab === "precos" ? "tabela de preço" : "variações";
      const mensagem = `Você tem alterações não salvas na ${abaNome}.\n\n` +
        "O que deseja fazer?\n" +
        "- Clique em 'OK' para salvar as alterações e mudar de aba\n" +
        "- Clique em 'Cancelar' para permanecer nesta aba (suas alterações serão mantidas)";
      
      const salvar = window.confirm(mensagem);

      if (salvar) {
        // Disparar evento para salvar alterações
        const saveEvent = new CustomEvent("saveChangesRequest", {
          detail: { produtoId: produto.id },
        });
        window.dispatchEvent(saveEvent);
        
        // Aguardar um pouco para o salvamento acontecer
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        // Usuário cancelou - não mudar de aba
        return;
      }
    }

    // Mudar de aba
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

