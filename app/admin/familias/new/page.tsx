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
    <FormShell 
      title="Nova Família"
      actions={
        <>
          <button 
            type="button" 
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2" 
            onClick={()=>router.back()}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting} 
            form="familia-form"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="familia-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria</label>
          <select {...register("categoriaId")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione...</option>
            {categorias.map((c:any)=>(<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
          {errors.categoriaId && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.categoriaId.message)}</p>}
        </div>
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
          <input type="checkbox" id="ativo" {...register("ativo")} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" />
          <label htmlFor="ativo" className="text-sm font-medium text-gray-700">Ativo</label>
        </div>
      </form>
    </FormShell>
  );
}

