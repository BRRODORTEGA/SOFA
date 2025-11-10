"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { produtoSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProduto({ item }: { item: any }) {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(produtoSchema),
    defaultValues: { 
      categoriaId: item.categoriaId || "",
      familiaId: item.familiaId || "",
      nome: item.nome || "",
      tipo: item.tipo || "",
      abertura: item.abertura || "",
      acionamento: item.acionamento || "",
      configuracao: item.configuracao || "",
      imagens: item.imagens || [],
      status: item.status ?? true,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "imagens" });
  const categoriaId = watch("categoriaId");

  useEffect(() => {
    async function loadData() {
      const [catRes, famRes] = await Promise.all([
        fetch("/api/categorias").then(r=>r.json()),
        fetch("/api/familias").then(r=>r.json())
      ]);
      
      const cats = catRes.data?.items || [];
      const fams = famRes.data?.items || [];
      
      setCategorias(cats);
      setFamilias(fams);
    }
    
    loadData();
  }, []);

  // Garantir que os valores sejam definidos após carregar as opções
  useEffect(() => {
    if (categorias.length > 0 && item.categoriaId) {
      setValue("categoriaId", item.categoriaId, { shouldValidate: false });
    }
  }, [categorias, item.categoriaId, setValue]);

  useEffect(() => {
    if (familias.length > 0 && item.familiaId) {
      setValue("familiaId", item.familiaId, { shouldValidate: false });
    }
  }, [familias, item.familiaId, setValue]);

  const familiasFiltradas = categoriaId ? familias.filter((f:any)=>f.categoriaId === categoriaId) : familias;

  async function onSubmit(values:any) {
    try {
      const payload = {
        categoriaId: values.categoriaId,
        familiaId: values.familiaId,
        nome: values.nome,
        tipo: values.tipo || null,
        abertura: values.abertura || null,
        acionamento: values.acionamento || null,
        configuracao: values.configuracao || null,
        imagens: values.imagens.filter((url: string) => url.trim() !== ""),
        status: Boolean(values.status),
      };
      
      console.log("Enviando dados:", payload); // Debug
      
      const res = await fetch(`/api/produtos/${item.id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      console.log("Resposta da API:", data); // Debug
      
      if (res.ok && data.ok) {
        router.push("/admin/produtos");
        router.refresh();
      } else {
        const errorMsg = data.error || data.details || "Erro ao salvar";
        alert(`Erro ao salvar: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar. Verifique o console para mais detalhes.");
    }
  }
  async function onDelete() {
    if (!confirm("Excluir este produto?")) return;
    const res = await fetch(`/api/produtos/${item.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/produtos");
    else alert("Erro ao excluir");
  }

  return (
    <FormShell 
      title="Editar Produto"
    >
      <form id="edit-produto-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          <input 
            type="checkbox" 
            id="status" 
            {...register("status", { 
              setValueAs: (value) => Boolean(value)
            })} 
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" 
          />
          <label htmlFor="status" className="text-sm font-medium text-gray-700">Status (Ativo)</label>
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

