"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tabelaPrecoSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";

export default function EditTabelaPreco({ item }: { item: any }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(tabelaPrecoSchema),
    defaultValues: {
      nome: item.nome || "",
      ativo: item.ativo ?? true,
      descricao: item.descricao || "",
    },
  });

  async function onSubmit(values: any) {
    try {
      const payload = {
        nome: values.nome,
        ativo: Boolean(values.ativo),
        descricao: values.descricao || null,
      };
      
      console.log("Enviando dados:", payload);
      
      const res = await fetch(`/api/tabelas-preco/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      console.log("Resposta da API:", data);
      
      if (res.ok && data.ok) {
        router.push("/admin/tabelas-preco");
        router.refresh();
      } else {
        const errorMsg = data.error || data.details || "Erro ao salvar";
        alert(`Erro ao salvar: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao salvar tabela de preços:", error);
      alert("Erro ao salvar. Verifique o console para mais detalhes.");
    }
  }

  async function onDelete() {
    if (!confirm("Excluir esta tabela de preços?")) return;
    try {
      const res = await fetch(`/api/tabelas-preco/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (res.ok && data.ok) {
        router.push("/admin/tabelas-preco");
        router.refresh();
      } else {
        const errorMsg = data.error?.message || data.error || data.details || "Erro ao excluir";
        alert(`Erro ao excluir: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao excluir tabela de preços:", error);
      alert("Erro ao excluir. Verifique o console para mais detalhes.");
    }
  }

  return (
    <FormShell title="Editar Tabela de Preços">
      <form id="edit-tabela-preco-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
          <input
            {...register("nome")}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.nome && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição (opcional)</label>
          <textarea
            {...register("descricao")}
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.descricao && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.descricao.message)}</p>}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="ativo"
            {...register("ativo", {
              setValueAs: (value) => Boolean(value),
            })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="ativo" className="text-sm font-medium text-gray-700">Ativo</label>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => router.push(`/admin/tabelas-preco/${item.id}?tab=precos`)}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Ver Tabela de Preços
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Excluir
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
          </div>
        </div>
      </form>
    </FormShell>
  );
}

