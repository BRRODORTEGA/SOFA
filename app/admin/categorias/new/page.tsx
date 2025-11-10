"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoriaSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";

export default function NewCategoriaPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(categoriaSchema), defaultValues: { ativo: true } });

  async function onSubmit(values:any) {
    const res = await fetch("/api/categorias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    if (res.ok) router.push("/admin/categorias");
    else alert("Erro ao criar");
  }

  return (
    <FormShell title="Nova Categoria">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Nome</label>
          <input {...register("nome")} className="mt-1 w-full rounded border p-2" />
          {errors.nome && <p className="text-sm text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" {...register("ativo")} />
          <label htmlFor="ativo" className="text-sm">Ativo</label>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={()=>router.back()}>Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="rounded bg-black px-3 py-2 text-sm text-white">Salvar</button>
        </div>
      </form>
    </FormShell>
  );
}

