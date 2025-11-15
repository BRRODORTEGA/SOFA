"use client";

import { useFieldArray, Control, UseFormWatch, Controller } from "react-hook-form";
import { useRef, useState } from "react";

interface ProdutoImagensBlocosProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export function ProdutoImagensBlocos({
  control,
  watch,
  uploading,
  setUploading,
  fileInputRef,
}: ProdutoImagensBlocosProps) {
  // Bloco 1: Foto Principal (1 imagem)
  const {
    fields: principalFields,
    append: appendPrincipal,
    remove: removePrincipal,
  } = useFieldArray({ control, name: "imagemPrincipal" });

  // Bloco 2: Fotos Complementares (até 5 imagens)
  const {
    fields: complementaresFields,
    append: appendComplementar,
    remove: removeComplementar,
  } = useFieldArray({ control, name: "imagensComplementares" });

  // Bloco 3: Extra (ilimitado)
  const {
    fields: extraFields,
    append: appendExtra,
    remove: removeExtra,
  } = useFieldArray({ control, name: "imagensExtra" });

  const [activeBlock, setActiveBlock] = useState<"principal" | "complementar" | "extra" | null>(null);

  function handleUploadClick(block: "principal" | "complementar" | "extra") {
    setActiveBlock(block);
    fileInputRef.current?.click();
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

    // Fazer upload via API
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/imagem", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.ok && data.data?.url) {
        const imageUrl = data.data.url;
        
        if (activeBlock === "principal") {
          if (principalFields.length === 0) {
            appendPrincipal(imageUrl);
          } else {
            alert("Já existe uma foto principal. Remova a atual antes de adicionar outra.");
          }
        } else if (activeBlock === "complementar") {
          if (complementaresFields.length < 5) {
            appendComplementar(imageUrl);
          } else {
            alert("Máximo de 5 fotos complementares atingido.");
          }
        } else if (activeBlock === "extra") {
          appendExtra(imageUrl);
        }
      } else {
        const errorMsg = data.error || data.details || "Erro ao fazer upload";
        alert(`Erro ao fazer upload: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload. Verifique o console para mais detalhes.");
    } finally {
      setUploading(false);
      setActiveBlock(null);
      e.target.value = "";
    }
  }

  function ImagePreview({
    url,
    onRemove,
    registerName,
  }: {
    url: string;
    onRemove: () => void;
    registerName: string;
  }) {
    const isValidUrl = url && (url.startsWith("http") || url.startsWith("/") || url.startsWith("data:"));
    return (
      <div className="relative group">
        {isValidUrl ? (
          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
            <img
              src={url}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EImagem inválida%3C/text%3E%3C/svg%3E";
              }}
            />
            <button
              type="button"
              onClick={onRemove}
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
        <Controller
          name={registerName as any}
          control={control}
          defaultValue={url || ""}
          render={({ field }) => (
            <input
              {...field}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://... ou /uploads/..."
            />
          )}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input de arquivo oculto - o onChange será gerenciado pelo componente */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={(e) => handleFileUpload(e)}
        className="hidden"
      />

      {/* BLOCO 1: Foto Principal */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-900">
            📸 Foto Principal
          </label>
          <span className="text-xs text-gray-600">1 foto</span>
        </div>
        
        {principalFields.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {principalFields.map((f, idx) => {
              const imageUrl = watch(`imagemPrincipal.${idx}` as const);
              return (
                <ImagePreview
                  key={f.id}
                  url={imageUrl || ""}
                  onRemove={() => removePrincipal(idx)}
                  registerName={`imagemPrincipal.${idx}`}
                />
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-500 mb-3">Nenhuma foto principal adicionada</p>
            <button
              type="button"
              onClick={() => handleUploadClick("principal")}
              disabled={uploading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? "Enviando..." : "📤 Adicionar Foto Principal"}
            </button>
          </div>
        )}
      </div>

      {/* BLOCO 2: Fotos Complementares */}
      <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-900">
            🖼️ Fotos Complementares
          </label>
          <span className="text-xs text-gray-600">
            {complementaresFields.length}/5 fotos
          </span>
        </div>
        
        {complementaresFields.length > 0 ? (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {complementaresFields.map((f, idx) => {
              const imageUrl = watch(`imagensComplementares.${idx}` as const);
              return (
                <ImagePreview
                  key={f.id}
                  url={imageUrl || ""}
                  onRemove={() => removeComplementar(idx)}
                  registerName={`imagensComplementares.${idx}`}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-3">Nenhuma foto complementar adicionada</p>
        )}
        
        {complementaresFields.length < 5 && (
          <button
            type="button"
            onClick={() => handleUploadClick("complementar")}
            disabled={uploading || complementaresFields.length >= 5}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? "Enviando..." : "📤 Adicionar Foto Complementar"}
          </button>
        )}
      </div>

      {/* BLOCO 3: Extra */}
      <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <label className="block text-sm font-bold text-gray-900">
            ⭐ Extra
          </label>
          <span className="text-xs text-gray-600">
            {extraFields.length} foto(s)
          </span>
        </div>
        
        {extraFields.length > 0 && (
          <div className="mb-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {extraFields.map((f, idx) => {
              const imageUrl = watch(`imagensExtra.${idx}` as const);
              return (
                <ImagePreview
                  key={f.id}
                  url={imageUrl || ""}
                  onRemove={() => removeExtra(idx)}
                  registerName={`imagensExtra.${idx}`}
                />
              );
            })}
          </div>
        )}
        
        <button
          type="button"
          onClick={() => handleUploadClick("extra")}
          disabled={uploading}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? "Enviando..." : "📤 Adicionar Foto Extra"}
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Você pode fazer upload de imagens (JPEG, PNG, WebP, GIF - máx. 5MB) ou adicionar URLs de imagens.
      </p>
    </div>
  );
}

