"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { produtoSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NewProdutoPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(produtoSchema), defaultValues: { status: true, imagens: [] } });
  const { fields, append, remove } = useFieldArray({ control, name: "imagens" });
  const categoriaId = watch("categoriaId");

  useEffect(() => {
    fetch("/api/categorias").then(r=>r.json()).then(d=>setCategorias(d.data?.items || []));
    fetch("/api/familias").then(r=>r.json()).then(d=>setFamilias(d.data?.items || []));
  }, []);

  const familiasFiltradas = categoriaId ? familias.filter((f:any)=>f.categoriaId === categoriaId) : familias;

  async function onSubmit(values:any) {
    const data = { ...values, imagens: values.imagens.filter((url: string) => url.trim() !== "") };
    const res = await fetch("/api/produtos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) router.push("/admin/produtos");
    else alert("Erro ao criar");
  }

  return (
    <FormShell 
      title="Novo Produto"
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
            form="produto-form"
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </>
      }
    >
      <form id="produto-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria</label>
          <select {...register("categoriaId")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione...</option>
            {categorias.map((c:any)=>(<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
          {errors.categoriaId && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.categoriaId.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Família</label>
          <select {...register("familiaId")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione...</option>
            {familiasFiltradas.map((f:any)=>(<option key={f.id} value={f.id}>{f.nome}</option>))}
          </select>
          {errors.familiaId && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.familiaId.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
          <input {...register("nome")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.nome && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
          <input {...register("tipo")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex.: Modular" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Abertura</label>
          <input {...register("abertura")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex.: Retrátil" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Acionamento</label>
          <input {...register("acionamento")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex.: Manual" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Configuração</label>
          <input {...register("configuracao")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex.: Módulo com braço" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Imagens (URLs)</label>
          <div className="space-y-2">
            {fields.map((f, idx)=>(
              <div key={f.id} className="flex items-center gap-2">
                <input {...register(`imagens.${idx}` as const)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                <button type="button" onClick={()=>remove(idx)} className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:border-red-300 hover:text-red-700">Remover</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={()=>append("")} className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700">+ Adicionar URL</button>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="status" {...register("status")} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" />
          <label htmlFor="status" className="text-sm font-medium text-gray-700">Status (Ativo)</label>
        </div>
      </form>
    </FormShell>
  );
}

