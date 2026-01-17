"use client";

import { useState, useRef } from "react";
import { Control, Controller, UseFormSetValue } from "react-hook-form";

interface TecidoImagemUploadProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  imagemUrl?: string;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
}

export function TecidoImagemUpload({
  control,
  setValue,
  imagemUrl = "",
  uploading,
  setUploading,
}: TecidoImagemUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Atualizar o campo imagemUrl no formulário usando setValue
        setValue("imagemUrl", data.data.url, { shouldValidate: true, shouldDirty: true });
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
      e.target.value = "";
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleRemoveImage() {
    setValue("imagemUrl", "", { shouldValidate: true, shouldDirty: true });
  }

  const currentImageUrl = imagemUrl || "";
  const isValidUrl = currentImageUrl && (currentImageUrl.startsWith("http") || currentImageUrl.startsWith("/"));

  return (
    <div className="space-y-4">
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Preview da imagem */}
      {isValidUrl && (
        <div className="relative group">
          <div className="relative aspect-square max-w-xs rounded-lg overflow-hidden border border-gray-300 bg-gray-100">
            <img
              src={currentImageUrl}
              alt="Preview do tecido"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-size='12'%3EImagem inválida%3C/text%3E%3C/svg%3E";
              }}
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
              title="Remover imagem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Campo de URL */}
      <div>
        <Controller
          name="imagemUrl"
          control={control}
          defaultValue={imagemUrl || ""}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://... ou /uploads/..."
            />
          )}
        />
      </div>

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
      </div>

      <p className="text-xs text-gray-500">
        Você pode fazer upload de imagens (JPEG, PNG, WebP, GIF - máx. 5MB) ou adicionar URLs de imagens.
      </p>
    </div>
  );
}

