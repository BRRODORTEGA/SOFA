"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { familiaSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewFamiliaPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(familiaSchema), defaultValues: { ativo: true } });

  useEffect(() => {
    fetch("/api/categorias").then(r=>r.json()).then(d=>setCategorias(d.data?.items || []));
  }, []);

  async function onSubmit(values:any) {
    let perfilMedidas = null;
    if (values.perfilMedidas && values.perfilMedidas.trim()) {
      try {
        perfilMedidas = JSON.parse(values.perfilMedidas);
      } catch {
        alert("JSON inválido no campo Perfil de Medidas");
        return;
      }
    }
    const data = { ...values, perfilMedidas };
    const res = await fetch("/api/familias", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) router.push("/admin/familias");
    else alert("Erro ao criar");
  }

  return (
    <FormShell title="Nova Família">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Categoria</label>
          <select {...register("categoriaId")} className="mt-1 w-full rounded border p-2">
            <option value="">Selecione...</option>
            {categorias.map((c:any)=>(<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
          {errors.categoriaId && <p className="text-sm text-red-600">{String(errors.categoriaId.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Nome</label>
          <input {...register("nome")} className="mt-1 w-full rounded border p-2" />
          {errors.nome && <p className="text-sm text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Descrição</label>
          <textarea {...register("descricao")} rows={3} className="mt-1 w-full rounded border p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium">Perfil de Medidas (JSON opcional)</label>
          <textarea {...register("perfilMedidas")} rows={6} className="mt-1 w-full rounded border p-2 font-mono text-xs" placeholder='{"medidas":[80,90,100,110,120],"dimensoes":{"80":{"largura":...}},"metragem":{"tecido":{"80":..},"couro":{"80":..}}}' />
          <p className="text-xs text-gray-500">Deixe vazio se não desejar. Validaremos o JSON na geração de variações (Fase 5).</p>
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

