"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { produtoSchema } from "@/lib/validators";
import { FormShell } from "@/components/admin/form-shell";
import { ProdutoImagensBlocos } from "@/components/admin/ProdutoImagensBlocos";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function NewProdutoPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [nomesPadrao, setNomesPadrao] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [acionamentoManual, setAcionamentoManual] = useState(false);
  const [acionamentoAutomatico, setAcionamentoAutomatico] = useState(false);
  const [possuiLadosSim, setPossuiLadosSim] = useState(false);
  const [possuiLadosNao, setPossuiLadosNao] = useState(true); // Default: Não
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { register, handleSubmit, control, watch, setValue, formState: { errors, isSubmitting } } = useForm({ 
    resolver: zodResolver(produtoSchema), 
    defaultValues: { 
      status: true,
      possuiLados: false, // Default: Não
      imagens: [],
      imagemPrincipal: [],
      imagensComplementares: [],
      imagensExtra: [],
    } 
  });
  const categoriaId = watch("categoriaId");

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, famRes, nomesRes] = await Promise.all([
          fetch("/api/categorias").then(r => r.json()),
          fetch("/api/familias").then(r => r.json()),
          fetch("/api/nomes-padrao-produto?limit=100").then(r => r.json())
        ]);
        
        const cats = catRes.data?.items || [];
        const fams = famRes.data?.items || [];
        const nomes = nomesRes.data?.items?.filter((n: any) => n.ativo) || [];
        
        setCategorias(cats);
        setFamilias(fams);
        setNomesPadrao(nomes);
        console.log("Famílias carregadas:", fams); // Debug
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
    
    loadData();
  }, []);

  // Filtrar famílias: se categoriaId estiver selecionado, mostrar apenas famílias dessa categoria
  // Se categoriaId for null/undefined na família, mostrar também (famílias sem categoria)
  const familiasFiltradas = categoriaId 
    ? familias.filter((f:any) => !f.categoriaId || f.categoriaId === categoriaId)
    : familias;

  async function onSubmit(values:any) {
    // Processar acionamento dos checkboxes
    const acionamentos: string[] = [];
    if (acionamentoManual) acionamentos.push("Manual");
    if (acionamentoAutomatico) acionamentos.push("Automático");
    const acionamentoValue = acionamentos.length > 0 ? acionamentos.join(",") : null;
    
    // Combinar os 3 blocos de imagens em um único array
    const todasImagens: string[] = [];
    if (values.imagemPrincipal && values.imagemPrincipal.length > 0) {
      todasImagens.push(...values.imagemPrincipal.filter((url: string) => url && url.trim() !== ""));
    }
    if (values.imagensComplementares && values.imagensComplementares.length > 0) {
      todasImagens.push(...values.imagensComplementares.filter((url: string) => url && url.trim() !== ""));
    }
    if (values.imagensExtra && values.imagensExtra.length > 0) {
      todasImagens.push(...values.imagensExtra.filter((url: string) => url && url.trim() !== ""));
    }
    
    const data = { 
      ...values, 
      acionamento: acionamentoValue,
      possuiLados: values.possuiLados ?? false,
      imagens: todasImagens
    };
    
    try {
      const res = await fetch("/api/produtos", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(data) 
      });
      
      const result = await res.json();
      
      if (res.ok && result.ok) {
        // Verificar se múltiplos produtos foram criados
        const totalCreated = result.data?._meta?.totalCreated || 1;
        if (totalCreated > 1) {
          alert(`${totalCreated} produtos criados com sucesso! Um para cada tipo de acionamento selecionado.`);
        } else {
          alert("Produto criado com sucesso!");
        }
        router.push("/admin/produtos");
        router.refresh();
      } else {
        // Tratar diferentes formatos de erro
        let errorMsg = "Erro ao criar produto";
        if (result.message) {
          errorMsg = result.message;
        } else if (result.error) {
          errorMsg = result.error;
        } else if (result.details) {
          errorMsg = result.details;
        } else if (result.fieldErrors) {
          // Se houver erros de campo específicos, exibir o primeiro
          const firstError = Object.values(result.fieldErrors)[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
            errorMsg = firstError[0];
          }
        }
        alert(`Erro ao criar produto: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao criar produto:", error);
      alert("Erro ao criar produto. Verifique o console para mais detalhes.");
    }
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
            {familiasFiltradas.length === 0 ? (
              <option disabled>Nenhuma família disponível</option>
            ) : (
              familiasFiltradas.map((f:any) => (
                <option key={f.id} value={f.id}>
                  {f.nome} {f.categoriaId ? `(${f.categoria?.nome || ""})` : ""}
                </option>
              ))
            )}
          </select>
          {errors.familiaId && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.familiaId.message)}</p>}
          {familiasFiltradas.length === 0 && categoriaId && (
            <p className="mt-2 text-sm text-gray-500">Nenhuma família ativa encontrada para esta categoria.</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome <span className="text-red-500">*</span></label>
          <select 
            {...register("nome", { 
              required: "Selecione um nome padrão",
              validate: (value) => {
                const nomeValido = nomesPadrao.some((n: any) => n.nome === value);
                if (!nomeValido) {
                  return "Selecione um nome padrão válido da lista";
                }
                return true;
              }
            })} 
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" 
          >
            <option value="">Selecione um nome padrão...</option>
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
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acionamentoManual}
                onChange={(e) => setAcionamentoManual(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-base font-medium text-gray-700">Manual</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acionamentoAutomatico}
                onChange={(e) => setAcionamentoAutomatico(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-base font-medium text-gray-700">Automático</span>
            </label>
            {!acionamentoManual && !acionamentoAutomatico && (
              <p className="text-sm text-gray-500 italic">Nenhum acionamento selecionado. Será criada variação com acionamento "não aplicável".</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Possui Lados <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={possuiLadosSim}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPossuiLadosSim(true);
                    setPossuiLadosNao(false);
                    setValue("possuiLados", true);
                  }
                }}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className={`text-base font-medium ${possuiLadosSim ? 'text-gray-900' : 'text-gray-500'}`}>
                Sim
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={possuiLadosNao}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPossuiLadosNao(true);
                    setPossuiLadosSim(false);
                    setValue("possuiLados", false);
                  }
                }}
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary"
              />
              <span className={`text-base font-medium ${possuiLadosNao ? 'text-gray-900' : 'text-gray-500'}`}>
                Não
              </span>
            </label>
            {errors.possuiLados && (
              <p className="text-sm text-red-600">{errors.possuiLados.message as string}</p>
            )}
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
          <input type="checkbox" id="status" {...register("status")} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500" />
          <label htmlFor="status" className="text-sm font-medium text-gray-700">Status (Ativo)</label>
        </div>
      </form>
    </FormShell>
  );
}

