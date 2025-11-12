"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { produtoSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function EditProduto({ item }: { item: any }) {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Filtrar famílias: se categoriaId estiver selecionado, mostrar apenas famílias dessa categoria
  // Se categoriaId for null/undefined na família, mostrar também (famílias sem categoria)
  const familiasFiltradas = categoriaId 
    ? familias.filter((f:any) => !f.categoriaId || f.categoriaId === categoriaId)
    : familias;

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
    if (!confirm(`Excluir o produto "${item.nome}"?`)) return;
    try {
      const res = await fetch(`/api/produtos/${item.id}`, { method: "DELETE" });
      const result = await res.json();
      
      if (res.ok && result.ok) {
        router.push("/admin/produtos");
        router.refresh();
      } else {
        const errorMsg = result.error || result.details || result.message || "Erro ao excluir produto";
        alert(`Erro ao excluir: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto. Verifique o console para mais detalhes.");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
      e.target.value = "";
      return;
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Arquivo muito grande. Tamanho máximo: 5MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/imagem", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.ok && data.data?.url) {
        // Adicionar a URL da imagem ao array de imagens
        append(data.data.url);
        alert("Imagem enviada com sucesso!");
      } else {
        const errorMsg = data.error || data.details || "Erro ao fazer upload";
        alert(`Erro ao fazer upload: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload. Verifique o console para mais detalhes.");
    } finally {
      setUploading(false);
      e.target.value = ""; // Limpar o input
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Imagens</label>
          
          {/* Preview das imagens */}
          {fields.length > 0 && (
            <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {fields.map((f, idx) => {
                const imageUrl = watch(`imagens.${idx}` as const);
                const isValidUrl = imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("/"));
                return (
                  <div key={f.id} className="relative group">
                    {isValidUrl ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
                        <img
                          src={imageUrl}
                          alt={`Imagem ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EImagem inválida%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => remove(idx)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          title="Remover imagem"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
                        <span className="text-xs text-gray-500 text-center px-2">URL inválida</span>
                      </div>
                    )}
                    <input
                      {...register(`imagens.${idx}` as const)}
                      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://... ou /uploads/..."
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Botões de ação */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={uploading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? "Enviando..." : "📤 Fazer Upload"}
            </button>
            <button
              type="button"
              onClick={() => append("")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              + Adicionar URL
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Você pode fazer upload de imagens (JPEG, PNG, WebP, GIF - máx. 5MB) ou adicionar URLs de imagens.
          </p>
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

