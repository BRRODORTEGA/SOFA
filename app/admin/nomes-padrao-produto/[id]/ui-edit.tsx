"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";

const nomePadraoSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  ativo: z.boolean().default(true),
  ordem: z.coerce.number().int().optional().nullable(),
});

export default function EditNomePadrao({ item }: { item: any }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ 
    resolver: zodResolver(nomePadraoSchema),
    defaultValues: {
      nome: item.nome,
      ativo: item.ativo,
      ordem: item.ordem,
    },
  });

  async function onSubmit(values: any) {
    try {
      const res = await fetch(`/api/nomes-padrao-produto/${item.id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(values) 
      });
      
      const result = await res.json();
      
      if (res.ok && result.ok) {
        router.push("/admin/nomes-padrao-produto");
        router.refresh();
      } else {
        const errorMsg = result.message || result.error || "Erro ao salvar nome padrão";
        alert(`Erro ao salvar: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao salvar nome padrão:", error);
      alert("Erro ao salvar nome padrão. Verifique o console para mais detalhes.");
    }
  }

  async function onDelete() {
    if (!confirm(`Excluir o nome padrão "${item.nome}"?`)) return;
    
    try {
      const res = await fetch(`/api/nomes-padrao-produto/${item.id}`, { method: "DELETE" });
      const result = await res.json();
      
      if (res.ok && result.ok) {
        router.push("/admin/nomes-padrao-produto");
        router.refresh();
      } else {
        const errorMsg = result.error || result.message || "Erro ao excluir nome padrão";
        alert(`Erro ao excluir: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao excluir nome padrão:", error);
      alert("Erro ao excluir nome padrão. Verifique o console para mais detalhes.");
    }
  }

  return (
    <FormShell 
      title="Editar Nome Padrão"
      actions={
        <>
          <button 
            type="button" 
            className="rounded-lg border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2" 
            onClick={onDelete}
          >
            Excluir
          </button>
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
            form="nome-padrao-form"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="nome-padrao-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
          <input 
            {...register("nome")} 
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          {errors.nome && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Ordem (opcional)</label>
          <input 
            type="number"
            {...register("ordem")} 
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="Ordem de exibição"
          />
          {errors.ordem && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.ordem.message)}</p>}
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="ativo" 
            {...register("ativo")} 
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" 
          />
          <label htmlFor="ativo" className="text-sm font-medium text-gray-700">Ativo</label>
        </div>
      </form>
    </FormShell>
  );
}

