"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoriaSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";

export default function EditCategoria({ item }: { item: any }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(categoriaSchema),
    defaultValues: item,
  });

  async function onSubmit(values:any) {
    const res = await fetch(`/api/categorias/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    if (res.ok) router.push("/admin/categorias");
    else alert("Erro ao salvar");
  }
  async function onDelete() {
    if (!confirm("Excluir esta categoria?")) return;
    const res = await fetch(`/api/categorias/${item.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/categorias");
    else alert("Erro ao excluir");
  }

  return (
    <FormShell 
      title="Editar Categoria"
      actions={
        <>
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
            form="edit-categoria-form"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="edit-categoria-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
          <input 
            {...register("nome")} 
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
          {errors.nome && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>}
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

