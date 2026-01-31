"use client";

import { useFieldArray, Control, UseFormWatch, Controller, UseFormSetValue } from "react-hook-form";
import { useRef, useState } from "react";

interface ProdutoImagensBlocosProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  tecidos?: Array<{ id: string; nome: string }>; // Tecidos do produto
  onAutoSave?: () => Promise<void>; // Função para salvar automaticamente após upload
  produtoId?: string; // ID do produto para salvar automaticamente
}

export function ProdutoImagensBlocos({
  control,
  watch,
  setValue,
  uploading,
  setUploading,
  fileInputRef,
  tecidos = [],
  onAutoSave,
  produtoId,
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validar todos os arquivos primeiro
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`Arquivo "${file.name}" não é permitido. Use JPEG, PNG, WebP ou GIF.`);
        continue;
      }

      if (file.size > maxSize) {
        alert(`Arquivo "${file.name}" muito grande. Tamanho máximo: 5MB.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = "";
      return;
    }

    setUploading(true);

    let uploadedCount = 0;

    try {
      // Processar arquivos em sequência
      for (const file of validFiles) {
        // Verificar limites antes de fazer upload
        if (activeBlock === "principal") {
          const currentPrincipal = watch("imagemPrincipal") || [];
          if (currentPrincipal.length > 0) {
            alert("Já existe uma foto principal. Remova a atual antes de adicionar outra.");
            continue;
          }
        } else if (activeBlock === "complementar") {
          const currentComplementares = watch("imagensComplementares") || [];
          if (currentComplementares.length >= 5) {
            alert("Máximo de 5 fotos complementares atingido.");
            continue;
          }
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/imagem", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.ok && data.data?.url) {
          const imageUrl = data.data.url;
          
          // Verificar novamente antes de adicionar (pode ter mudado durante o upload)
          if (activeBlock === "principal") {
            const currentPrincipal = watch("imagemPrincipal") || [];
            if (currentPrincipal.length === 0) {
              appendPrincipal(imageUrl);
              uploadedCount++;
            } else {
              alert("Já existe uma foto principal. Remova a atual antes de adicionar outra.");
            }
          } else if (activeBlock === "complementar") {
            const currentComplementares = watch("imagensComplementares") || [];
            if (currentComplementares.length < 5) {
              appendComplementar(imageUrl);
              uploadedCount++;
            } else {
              alert("Máximo de 5 fotos complementares atingido.");
            }
          } else if (activeBlock === "extra") {
            appendExtra(imageUrl);
            uploadedCount++;
          }
        } else {
          const errorMsg = data.error || data.details || "Erro ao fazer upload";
          alert(`Erro ao fazer upload de "${file.name}": ${errorMsg}`);
        }
      }

      // Salvar automaticamente após todos os uploads bem-sucedidos (apenas se for edição e houver uploads)
      if (uploadedCount > 0 && produtoId && onAutoSave) {
        try {
          await onAutoSave();
        } catch (error) {
          console.error("Erro ao salvar automaticamente:", error);
          // Não mostrar erro ao usuário, apenas logar
        }
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
    tecidoId,
    onRemove,
    urlRegisterName,
    tecidoRegisterName,
  }: {
    url: string;
    tecidoId?: string | null;
    onRemove: () => void;
    urlRegisterName: string;
    tecidoRegisterName: string;
  }) {
    const isValidUrl = url && (url.startsWith("http") || url.startsWith("/") || url.startsWith("data:"));
    return (
      <div className="relative group space-y-2">
        {isValidUrl ? (
          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center">
            <img
              src={url}
              alt="Preview"
              className="w-full h-full object-contain"
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
          name={urlRegisterName as any}
          control={control}
          defaultValue={url || ""}
          render={({ field }) => (
            <input
              {...field}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://... ou /uploads/..."
            />
          )}
        />
        {tecidos.length > 0 && (
          <Controller
            name={tecidoRegisterName as any}
            control={control}
            defaultValue={tecidoId || ""}
            render={({ field }) => (
              <select
                {...field}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">🌐 Todos os tecidos</option>
                {tecidos.map((tecido) => (
                  <option key={tecido.id} value={tecido.id}>
                    {tecido.nome}
                  </option>
                ))}
              </select>
            )}
          />
        )}
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
        multiple
        onChange={(e) => handleFileUpload(e)}
        className="hidden"
      />

      {/* BLOCO 1: Foto Principal */}
      <div className="rounded-lg border-2 border-primary/30 bg-secondary p-4">
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
              const tecidoId = watch(`imagemPrincipalTecido.${idx}` as const);
              return (
                <ImagePreview
                  key={f.id}
                  url={imageUrl || ""}
                  tecidoId={tecidoId}
                  onRemove={() => removePrincipal(idx)}
                  urlRegisterName={`imagemPrincipal.${idx}`}
                  tecidoRegisterName={`imagemPrincipalTecido.${idx}`}
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
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-domux-burgundy-dark disabled:bg-gray-400 disabled:cursor-not-allowed"
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
              const tecidoId = watch(`imagensComplementaresTecido.${idx}` as const);
              return (
                <ImagePreview
                  key={f.id}
                  url={imageUrl || ""}
                  tecidoId={tecidoId}
                  onRemove={() => removeComplementar(idx)}
                  urlRegisterName={`imagensComplementares.${idx}`}
                  tecidoRegisterName={`imagensComplementaresTecido.${idx}`}
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
              const tecidoId = watch(`imagensExtraTecido.${idx}` as const);
              return (
                <ImagePreview
                  key={f.id}
                  url={imageUrl || ""}
                  tecidoId={tecidoId}
                  onRemove={() => removeExtra(idx)}
                  urlRegisterName={`imagensExtra.${idx}`}
                  tecidoRegisterName={`imagensExtraTecido.${idx}`}
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

