"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tecidoSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";

export default function EditTecido({ item }: { item: any }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(tecidoSchema),
    defaultValues: item,
  });

  async function onSubmit(values:any) {
    const res = await fetch(`/api/tecidos/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    if (res.ok) router.push("/admin/tecidos");
    else alert("Erro ao salvar");
  }
  async function onDelete() {
    if (!confirm("Excluir este tecido?")) return;
    const res = await fetch(`/api/tecidos/${item.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/tecidos");
    else alert("Erro ao excluir");
  }

  return (
    <FormShell title="Editar Tecido">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Nome</label>
          <input {...register("nome")} className="mt-1 w-full rounded border p-2" />
          {errors.nome && <p className="text-sm text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Grade</label>
          <select {...register("grade")} className="mt-1 w-full rounded border p-2">
            {["G1000","G2000","G3000","G4000","G5000","G6000","G7000","COURO"].map(g=>(<option key={g} value={g}>{g}</option>))}
          </select>
          {errors.grade && <p className="text-sm text-red-600">{String(errors.grade.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">URL da Imagem</label>
          <input {...register("imagemUrl")} type="url" className="mt-1 w-full rounded border p-2" placeholder="https://..." />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" {...register("ativo")} />
          <label htmlFor="ativo" className="text-sm">Ativo</label>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onDelete} className="rounded border px-3 py-2 text-sm text-red-600">Excluir</button>
          <button type="submit" disabled={isSubmitting} className="rounded bg-black px-3 py-2 text-sm text-white">Salvar</button>
        </div>
      </form>
    </FormShell>
  );
}

