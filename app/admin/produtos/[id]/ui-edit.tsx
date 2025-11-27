"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { produtoSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { ProdutoImagensBlocos } from "@/components/admin/ProdutoImagensBlocos";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function EditProduto({ item }: { item: any }) {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [nomesPadrao, setNomesPadrao] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Parse acionamento inicial
  const acionamentoInicial = item.acionamento || "";
  const acionamentosIniciais = acionamentoInicial.split(",").map(a => a.trim()).filter(Boolean);
  const [acionamentoManual, setAcionamentoManual] = useState(acionamentosIniciais.includes("Manual"));
  const [acionamentoAutomatico, setAcionamentoAutomatico] = useState(acionamentosIniciais.includes("Automático"));
  
  // Separar imagens existentes nos 3 blocos (primeira = principal, próximas 5 = complementares, resto = extra)
  const imagensExistentes = item.imagens || [];
  const imagemPrincipalInicial = imagensExistentes.length > 0 ? [imagensExistentes[0]] : [];
  const imagensComplementaresInicial = imagensExistentes.slice(1, 6);
  const imagensExtraInicial = imagensExistentes.slice(6);

  const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
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
      imagemPrincipal: imagemPrincipalInicial,
      imagensComplementares: imagensComplementaresInicial,
      imagensExtra: imagensExtraInicial,
      status: item.status ?? true,
    },
  });
  const categoriaId = watch("categoriaId");

  useEffect(() => {
    async function loadData() {
      const [catRes, famRes, nomesRes] = await Promise.all([
        fetch("/api/categorias").then(r=>r.json()),
        fetch("/api/familias").then(r=>r.json()),
        fetch("/api/nomes-padrao-produto?limit=100").then(r => r.json())
      ]);
      
      const cats = catRes.data?.items || [];
      const fams = famRes.data?.items || [];
      const nomes = nomesRes.data?.items?.filter((n: any) => n.ativo) || [];
      
      setCategorias(cats);
      setFamilias(fams);
      setNomesPadrao(nomes);
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
      // Processar acionamento dos checkboxes
      const acionamentos: string[] = [];
      if (acionamentoManual) acionamentos.push("Manual");
      if (acionamentoAutomatico) acionamentos.push("Automático");
      const acionamentoValue = acionamentos.length > 0 ? acionamentos.join(",") : null;
      
      // Obter valores atuais do formulário (garantir que pegamos os valores mais recentes)
      const currentValues = getValues();
      
      // Combinar os 3 blocos de imagens em um único array
      const todasImagens: string[] = [];
      
      // Foto Principal
      const principal = currentValues.imagemPrincipal || values.imagemPrincipal || [];
      if (Array.isArray(principal) && principal.length > 0) {
        const principalFiltradas = principal
          .filter((url: any) => url && typeof url === 'string' && url.trim() !== "")
          .filter((url: string) => url.startsWith("http") || url.startsWith("/")); // Garantir formato válido
        todasImagens.push(...principalFiltradas);
      }
      
      // Fotos Complementares
      const complementares = currentValues.imagensComplementares || values.imagensComplementares || [];
      if (Array.isArray(complementares) && complementares.length > 0) {
        const complementaresFiltradas = complementares
          .filter((url: any) => url && typeof url === 'string' && url.trim() !== "")
          .filter((url: string) => url.startsWith("http") || url.startsWith("/")); // Garantir formato válido
        todasImagens.push(...complementaresFiltradas);
      }
      
      // Fotos Extra
      const extra = currentValues.imagensExtra || values.imagensExtra || [];
      if (Array.isArray(extra) && extra.length > 0) {
        const extraFiltradas = extra
          .filter((url: any) => url && typeof url === 'string' && url.trim() !== "")
          .filter((url: string) => url.startsWith("http") || url.startsWith("/")); // Garantir formato válido
        todasImagens.push(...extraFiltradas);
      }
      
      console.log("Imagens coletadas:", {
        principal: currentValues.imagemPrincipal,
        complementares: currentValues.imagensComplementares,
        extra: currentValues.imagensExtra,
        todasImagens,
        totalImagens: todasImagens.length
      });
      
      if (todasImagens.length === 0) {
        console.warn("Nenhuma imagem foi coletada! Verificando valores do formulário...");
        console.log("Valores completos do formulário:", currentValues);
      }
      
      const payload = {
        categoriaId: values.categoriaId,
        familiaId: values.familiaId,
        nome: values.nome,
        tipo: values.tipo || null,
        abertura: values.abertura || null,
        acionamento: acionamentoValue,
        configuracao: values.configuracao || null,
        imagens: todasImagens,
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
        // Tratar diferentes formatos de erro
        let errorMsg = "Erro ao salvar produto";
        if (data.message) {
          errorMsg = data.message;
        } else if (data.error) {
          errorMsg = data.error;
        } else if (data.details) {
          errorMsg = data.details;
        } else if (data.fieldErrors) {
          // Se houver erros de campo específicos, exibir o primeiro
          const firstError = Object.values(data.fieldErrors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMsg = firstError[0];
          }
        }
        alert(`Erro ao salvar produto: ${errorMsg}`);
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome <span className="text-red-500">*</span></label>
          <select 
            {...register("nome", { 
              required: "Selecione um nome padrão",
              validate: (value) => {
                // Verificar se o nome atual do produto está na lista (pode estar desativado)
                const nomeAtualValido = item.nome === value;
                const nomeValido = nomesPadrao.some((n: any) => n.nome === value);
                if (!nomeAtualValido && !nomeValido) {
                  return "Selecione um nome padrão válido da lista";
                }
                return true;
              }
            })} 
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          >
            <option value="">Selecione um nome padrão...</option>
            {/* Mostrar o nome atual mesmo que não esteja na lista (pode estar desativado) */}
            {!nomesPadrao.some((n: any) => n.nome === item.nome) && (
              <option value={item.nome}>{item.nome} (atual)</option>
            )}
            {nomesPadrao.map((nome: any) => (
              <option key={nome.id} value={nome.nome}>
                {nome.nome}
              </option>
            ))}
          </select>
          {errors.nome && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>}
          {nomesPadrao.length === 0 && (
            <p className="mt-2 text-sm text-yellow-600">
              ⚠️ Nenhum nome padrão ativo encontrado. <Link href="/admin/nomes-padrao-produto/new" className="text-blue-600 underline">Cadastre nomes padrões primeiro</Link>.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
          <select {...register("tipo")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione...</option>
            <option value="INTEIRO">INTEIRO</option>
            <option value="MODULAR">MODULAR</option>
            <option value="BIPARTIDO">BIPARTIDO</option>
            <option value="GIRATORIO">GIRATORIO</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Abertura</label>
          <select {...register("abertura")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione...</option>
            <option value="FIXO">FIXO</option>
            <option value="RETRATIL">RETRATIL</option>
            <option value="RECLINAVEL">RECLINAVEL</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Acionamento</label>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-not-allowed">
              <input
                type="checkbox"
                checked={acionamentoManual}
                onChange={() => {}} // Não fazer nada ao clicar
                disabled={true}
                readOnly={true}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
              />
              <span className={`text-base font-medium ${acionamentoManual ? 'text-gray-900' : 'text-gray-500'}`}>
                Manual
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-not-allowed">
              <input
                type="checkbox"
                checked={acionamentoAutomatico}
                onChange={() => {}} // Não fazer nada ao clicar
                disabled={true}
                readOnly={true}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
              />
              <span className={`text-base font-medium ${acionamentoAutomatico ? 'text-gray-900' : 'text-gray-500'}`}>
                Automático
              </span>
            </label>
            <p className="text-sm text-gray-500 italic">
              O acionamento não pode ser alterado após a criação do produto.
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Configuração</label>
          <input {...register("configuracao")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ex.: Módulo com braço" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Imagens</label>
          <ProdutoImagensBlocos
            control={control}
            watch={watch}
            uploading={uploading}
            setUploading={setUploading}
            fileInputRef={fileInputRef}
          />
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

