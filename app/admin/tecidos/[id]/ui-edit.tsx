"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tecidoSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { TecidoImagemUpload } from "@/components/admin/TecidoImagemUpload";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EditTecido({ item }: { item: any }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(tecidoSchema),
    defaultValues: {
      nome: item.nome || "",
      grade: item.grade || "G1000",
      imagemUrl: item.imagemUrl || "",
      fornecedorNome: item.fornecedorNome || "",
      valor_m2: item.valor_m2 ? Number(item.valor_m2) : "",
      ativo: item.ativo ?? true,
    },
  });
  const imagemUrl = watch("imagemUrl");

  async function onSubmit(values:any) {
    try {
      const payload = {
        nome: values.nome,
        grade: values.grade,
        imagemUrl: values.imagemUrl || null,
        fornecedorNome: values.fornecedorNome || null,
        valor_m2: values.valor_m2 ? Number(values.valor_m2) : null,
        ativo: Boolean(values.ativo),
      };
      
      console.log("Enviando dados:", payload); // Debug
      
      const res = await fetch(`/api/tecidos/${item.id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      console.log("Resposta da API:", data); // Debug
      
      if (res.ok && data.ok) {
        router.push("/admin/tecidos");
        router.refresh();
      } else {
        const errorMsg = data.error || data.details || "Erro ao salvar";
        alert(`Erro ao salvar: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao salvar tecido:", error);
      alert("Erro ao salvar. Verifique o console para mais detalhes.");
    }
  }
  async function onDelete() {
    if (!confirm("Excluir este tecido?")) return;
    try {
      const res = await fetch(`/api/tecidos/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      
      console.log("Resposta da exclusão:", data); // Debug
      
      if (res.ok && data.ok) {
        router.push("/admin/tecidos");
        router.refresh();
      } else {
        // Tenta extrair a mensagem de erro de diferentes formatos
        const errorMsg = data.error?.message || data.error || data.details?.message || data.details || "Erro ao excluir";
        alert(`Erro ao excluir: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao excluir tecido:", error);
      alert("Erro ao excluir. Verifique o console para mais detalhes.");
    }
  }

  return (
    <FormShell 
      title="Editar Tecido"
    >
      <form id="edit-tecido-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome</label>
          <input {...register("nome")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {errors.nome && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
          <select {...register("grade")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {["G1000","G2000","G3000","G4000","G5000","G6000","G7000","COURO"].map(g=>(<option key={g} value={g}>{g}</option>))}
          </select>
          {errors.grade && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.grade.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Imagem do Tecido</label>
          <TecidoImagemUpload
            control={control}
            setValue={setValue}
            imagemUrl={imagemUrl}
            uploading={uploading}
            setUploading={setUploading}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Fornecedor</label>
          <input {...register("fornecedorNome")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Tecidos ABC Ltda" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Valor do Tecido (m²)</label>
          <input {...register("valor_m2")} type="number" step="0.01" min="0" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0.00" />
          {errors.valor_m2 && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.valor_m2.message)}</p>}
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

