"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { familiaSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";

export default function EditFamilia({ item }: { item: any }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(familiaSchema),
    defaultValues: { 
      nome: item.nome || "",
      descricao: item.descricao || "",
      perfilMedidas: item.perfilMedidas ? JSON.stringify(item.perfilMedidas, null, 2) : "",
      ativo: item.ativo ?? true,
    },
  });

  async function onSubmit(values:any) {
    try {
      let perfilMedidas = null;
      if (values.perfilMedidas && values.perfilMedidas.trim()) {
        try {
          perfilMedidas = JSON.parse(values.perfilMedidas);
        } catch {
          alert("JSON inválido no campo Perfil de Medidas");
          return;
        }
      }
      
      const payload = {
        nome: values.nome,
        descricao: values.descricao || null,
        perfilMedidas: perfilMedidas,
        ativo: Boolean(values.ativo),
      };
      
      console.log("Enviando dados:", payload); // Debug
      
      const res = await fetch(`/api/familias/${item.id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      console.log("Resposta da API:", data); // Debug
      
      if (res.ok && data.ok) {
        router.push("/admin/familias");
        router.refresh();
      } else {
        const errorMsg = data.error || data.details || "Erro ao salvar";
        alert(`Erro ao salvar: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao salvar família:", error);
      alert("Erro ao salvar. Verifique o console para mais detalhes.");
    }
  }
  async function onDelete() {
    if (!confirm("Excluir esta família?")) return;
    try {
      const res = await fetch(`/api/familias/${item.id}`, { method: "DELETE" });
      const result = await res.json();
      
      if (res.ok && result.ok) {
        router.push("/admin/familias");
        router.refresh();
      } else {
        // Tratar erros de validação (422) ou outros erros
        const errorMsg = result.error || result.details || result.message || "Erro ao excluir família";
        alert(`Erro ao excluir: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao excluir família:", error);
      alert("Erro ao excluir. Verifique o console para mais detalhes.");
    }
  }

  return (
    <FormShell 
      title="Editar Família"
    >
      <form id="edit-familia-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
          <input {...register("nome")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.nome && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
          <textarea {...register("descricao")} rows={3} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Perfil de Medidas (JSON opcional)</label>
          <textarea {...register("perfilMedidas")} rows={6} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder='{"medidas":[80,90,100,110,120],"dimensoes":{"80":{"largura":...}},"metragem":{"tecido":{"80":..},"couro":{"80":..}}}' />
          <p className="mt-2 text-xs text-gray-500">Deixe vazio se não desejar. Validaremos o JSON na geração de variações (Fase 5).</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="ativo" 
            {...register("ativo", { 
              setValueAs: (value) => Boolean(value)
            })} 
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" 
          />
          <label htmlFor="ativo" className="text-sm font-medium text-gray-700">Ativo</label>
        </div>
        {/* Botões dentro do form para garantir que o submit funcione */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
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
      </form>
    </FormShell>
  );
}

