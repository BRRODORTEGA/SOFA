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
  const { register, handleSubmit, control, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(produtoSchema),
    defaultValues: { ...item, imagens: item.imagens || [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "imagens" });
  const categoriaId = watch("categoriaId");

  useEffect(() => {
    fetch("/api/categorias").then(r=>r.json()).then(d=>setCategorias(d.data?.items || []));
    fetch("/api/familias").then(r=>r.json()).then(d=>setFamilias(d.data?.items || []));
  }, []);

  const familiasFiltradas = categoriaId ? familias.filter((f:any)=>f.categoriaId === categoriaId) : familias;

  async function onSubmit(values:any) {
    const data = { ...values, imagens: values.imagens.filter((url: string) => url.trim() !== "") };
    const res = await fetch(`/api/produtos/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (res.ok) router.push("/admin/produtos");
    else alert("Erro ao salvar");
  }
  async function onDelete() {
    if (!confirm("Excluir este produto?")) return;
    const res = await fetch(`/api/produtos/${item.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/produtos");
    else alert("Erro ao excluir");
  }

  return (
    <FormShell title="Editar Produto">
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
          <label className="block text-sm font-medium">Família</label>
          <select {...register("familiaId")} className="mt-1 w-full rounded border p-2">
            <option value="">Selecione...</option>
            {familiasFiltradas.map((f:any)=>(<option key={f.id} value={f.id}>{f.nome}</option>))}
          </select>
          {errors.familiaId && <p className="text-sm text-red-600">{String(errors.familiaId.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Nome</label>
          <input {...register("nome")} className="mt-1 w-full rounded border p-2" />
          {errors.nome && <p className="text-sm text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Tipo</label>
          <input {...register("tipo")} className="mt-1 w-full rounded border p-2" placeholder="ex.: Modular" />
        </div>
        <div>
          <label className="block text-sm font-medium">Abertura</label>
          <input {...register("abertura")} className="mt-1 w-full rounded border p-2" placeholder="ex.: Retrátil" />
        </div>
        <div>
          <label className="block text-sm font-medium">Acionamento</label>
          <input {...register("acionamento")} className="mt-1 w-full rounded border p-2" placeholder="ex.: Manual" />
        </div>
        <div>
          <label className="block text-sm font-medium">Configuração</label>
          <input {...register("configuracao")} className="mt-1 w-full rounded border p-2" placeholder="ex.: Módulo com braço" />
        </div>
        <div>
          <label className="block text-sm font-medium">Imagens (URLs)</label>
          <div className="space-y-2">
            {fields.map((f, idx)=>(
              <div key={f.id} className="flex items-center gap-2">
                <input {...register(`imagens.${idx}` as const)} className="flex-1 rounded border p-2" placeholder="https://..." />
                <button type="button" onClick={()=>remove(idx)} className="rounded border px-2 py-1 text-sm">Remover</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={()=>append("")} className="mt-2 rounded border px-3 py-1 text-sm">+ Adicionar URL</button>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="status" {...register("status")} />
          <label htmlFor="status" className="text-sm">Status (Ativo)</label>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onDelete} className="rounded border px-3 py-2 text-sm text-red-600">Excluir</button>
          <button type="submit" disabled={isSubmitting} className="rounded bg-black px-3 py-2 text-sm text-white">Salvar</button>
        </div>
      </form>
    </FormShell>
  );
}

