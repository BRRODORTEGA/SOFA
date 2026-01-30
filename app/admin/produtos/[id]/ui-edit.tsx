"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
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
  const [tecidos, setTecidos] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Parse acionamento inicial
  const acionamentoInicial = item.acionamento || "";
  const acionamentosIniciais = acionamentoInicial.split(",").map(a => a.trim()).filter(Boolean);
  const [acionamentoManual, setAcionamentoManual] = useState(acionamentosIniciais.includes("Manual"));
  const [acionamentoAutomatico, setAcionamentoAutomatico] = useState(acionamentosIniciais.includes("Automático"));
  
  // Estado para Possui Lados (obrigatório)
  const possuiLadosInicial = item.possuiLados ?? false; // Default: false se não definido
  const [possuiLadosSim, setPossuiLadosSim] = useState(possuiLadosInicial === true);
  const [possuiLadosNao, setPossuiLadosNao] = useState(possuiLadosInicial === false);
  
  // Separar imagens existentes nos 3 blocos
  // Se houver imagensDetalhadas, usar elas; senão usar imagens antigas
  const imagensDetalhadas = item.imagensDetalhadas || [];
  let imagemPrincipalInicial: string[] = [];
  let imagensComplementaresInicial: string[] = [];
  let imagensExtraInicial: string[] = [];
  let imagemPrincipalTecidoInicial: (string | null)[] = [];
  let imagensComplementaresTecidoInicial: (string | null)[] = [];
  let imagensExtraTecidoInicial: (string | null)[] = [];
  
  if (imagensDetalhadas.length > 0) {
    // Usar imagensDetalhadas
    imagensDetalhadas.forEach(img => {
      if (img.tipo === "principal") {
        imagemPrincipalInicial.push(img.url);
        imagemPrincipalTecidoInicial.push(img.tecidoId);
      } else if (img.tipo === "complementar") {
        imagensComplementaresInicial.push(img.url);
        imagensComplementaresTecidoInicial.push(img.tecidoId);
      } else if (img.tipo === "extra") {
        imagensExtraInicial.push(img.url);
        imagensExtraTecidoInicial.push(img.tecidoId);
      }
    });
  } else {
    // Fallback para imagens antigas
    const imagensExistentes = item.imagens || [];
    imagemPrincipalInicial = imagensExistentes.length > 0 ? [imagensExistentes[0]] : [];
    imagensComplementaresInicial = imagensExistentes.slice(1, 6);
    imagensExtraInicial = imagensExistentes.slice(6);
    // Inicializar tecidoIds como null para imagens antigas
    imagemPrincipalTecidoInicial = imagemPrincipalInicial.map(() => null);
    imagensComplementaresTecidoInicial = imagensComplementaresInicial.map(() => null);
    imagensExtraTecidoInicial = imagensExtraInicial.map(() => null);
  }

  const { register, handleSubmit, control, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(produtoSchema),
    mode: "onChange", // Validar apenas quando o campo mudar
    defaultValues: { 
      categoriaId: item.categoriaId || "",
      familiaId: item.familiaId || "",
      nome: item.nome || "",
      tipo: item.tipo || "",
      abertura: item.abertura || "",
      acionamento: item.acionamento || "",
      possuiLados: item.possuiLados ?? false,
      configuracao: item.configuracao || "",
      informacoesAdicionais: item.informacoesAdicionais || "",
      imagens: item.imagens || [],
      imagemPrincipal: imagemPrincipalInicial,
      imagensComplementares: imagensComplementaresInicial,
      imagensExtra: imagensExtraInicial,
      imagemPrincipalTecido: imagemPrincipalTecidoInicial,
      imagensComplementaresTecido: imagensComplementaresTecidoInicial,
      imagensExtraTecido: imagensExtraTecidoInicial,
      status: item.status ?? true,
    },
  });
  const categoriaId = watch("categoriaId");

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, famRes, nomesRes, tecidosRes] = await Promise.all([
          fetch("/api/categorias").then(async r => {
            const text = await r.text();
            return text ? JSON.parse(text) : { data: { items: [] } };
          }),
          fetch("/api/familias").then(async r => {
            const text = await r.text();
            return text ? JSON.parse(text) : { data: { items: [] } };
          }),
          fetch("/api/nomes-padrao-produto?limit=100").then(async r => {
            const text = await r.text();
            return text ? JSON.parse(text) : { data: { items: [] } };
          }),
          fetch(`/api/produtos/${item.id}`).then(async r => {
            const text = await r.text();
            if (!text) {
              console.warn(`Resposta vazia da API /api/produtos/${item.id}`);
              return { data: {} };
            }
            try {
              return JSON.parse(text);
            } catch (e) {
              console.error(`Erro ao fazer parse do JSON da API /api/produtos/${item.id}:`, e);
              console.error("Resposta recebida:", text.substring(0, 200));
              return { data: {} };
            }
          })
        ]);
        
        const cats = catRes.data?.items || [];
        const fams = famRes.data?.items || [];
        const nomes = nomesRes.data?.items?.filter((n: any) => n.ativo) || [];
        const produto = tecidosRes.data || {};
        const tecs = produto.tecidos || [];
        
        setCategorias(cats);
        setFamilias(fams);
        setNomesPadrao(nomes);
        setTecidos(tecs);
        
        // Definir valores após carregar as opções - usar requestAnimationFrame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
          // Definir valores após carregar as opções
          if (cats.length > 0 && item.categoriaId) {
            const categoriaExiste = cats.some((c: any) => c.id === item.categoriaId);
            if (categoriaExiste) {
              setValue("categoriaId", item.categoriaId, { shouldValidate: false, shouldDirty: false });
            }
          }
          
          if (fams.length > 0 && item.familiaId) {
            const familiaExiste = fams.some((f: any) => f.id === item.familiaId);
            if (familiaExiste) {
              setValue("familiaId", item.familiaId, { shouldValidate: false, shouldDirty: false });
            }
          }
          
          if (item.nome) {
            setValue("nome", item.nome, { shouldValidate: false, shouldDirty: false });
          }
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
    
    loadData();
  }, [item.id, item.categoriaId, item.familiaId, item.nome, setValue]);

  // Filtrar famílias: se categoriaId estiver selecionado, mostrar apenas famílias dessa categoria
  // Se categoriaId for null/undefined na família, mostrar também (famílias sem categoria)
  const familiasFiltradas = categoriaId 
    ? familias.filter((f:any) => !f.categoriaId || f.categoriaId === categoriaId)
    : familias;

  // Função para salvar automaticamente apenas as imagens após upload
  async function handleAutoSave() {
    try {
      const currentValues = getValues();
      
      // Processar acionamento dos checkboxes
      const acionamentos: string[] = [];
      if (acionamentoManual) acionamentos.push("Manual");
      if (acionamentoAutomatico) acionamentos.push("Automático");
      const acionamentoValue = acionamentos.length > 0 ? acionamentos.join(",") : null;
      
      // Combinar os 3 blocos de imagens em um único array (compatibilidade)
      const todasImagens: string[] = [];
      // Array detalhado com tecidoId
      const imagensDetalhadas: Array<{ url: string; tecidoId: string | null; tipo: string; ordem: number }> = [];
      
      // Foto Principal
      const principal = currentValues.imagemPrincipal || [];
      const principalTecidos = currentValues.imagemPrincipalTecido || [];
      if (Array.isArray(principal) && principal.length > 0) {
        principal.forEach((url: any, idx: number) => {
          if (url && typeof url === 'string' && url.trim() !== "" && (url.startsWith("http") || url.startsWith("/"))) {
            todasImagens.push(url);
            imagensDetalhadas.push({
              url,
              tecidoId: principalTecidos[idx] || null,
              tipo: "principal",
              ordem: 0,
            });
          }
        });
      }
      
      // Fotos Complementares
      const complementares = currentValues.imagensComplementares || [];
      const complementaresTecidos = currentValues.imagensComplementaresTecido || [];
      if (Array.isArray(complementares) && complementares.length > 0) {
        complementares.forEach((url: any, idx: number) => {
          if (url && typeof url === 'string' && url.trim() !== "" && (url.startsWith("http") || url.startsWith("/"))) {
            todasImagens.push(url);
            imagensDetalhadas.push({
              url,
              tecidoId: complementaresTecidos[idx] || null,
              tipo: "complementar",
              ordem: idx,
            });
          }
        });
      }
      
      // Fotos Extra
      const extra = currentValues.imagensExtra || [];
      const extraTecidos = currentValues.imagensExtraTecido || [];
      if (Array.isArray(extra) && extra.length > 0) {
        extra.forEach((url: any, idx: number) => {
          if (url && typeof url === 'string' && url.trim() !== "" && (url.startsWith("http") || url.startsWith("/"))) {
            todasImagens.push(url);
            imagensDetalhadas.push({
              url,
              tecidoId: extraTecidos[idx] || null,
              tipo: "extra",
              ordem: idx,
            });
          }
        });
      }
      
      const payload = {
        categoriaId: currentValues.categoriaId || item.categoriaId,
        familiaId: currentValues.familiaId || item.familiaId,
        nome: currentValues.nome || item.nome,
        tipo: currentValues.tipo || item.tipo || null,
        abertura: currentValues.abertura || item.abertura || null,
        acionamento: acionamentoValue || item.acionamento || null,
        possuiLados: currentValues.possuiLados ?? (item.possuiLados ?? false),
        configuracao: currentValues.configuracao || item.configuracao || null,
        imagens: todasImagens,
        imagensDetalhadas: imagensDetalhadas,
        status: Boolean(currentValues.status ?? item.status ?? true),
      };
      
      const res = await fetch(`/api/produtos/${item.id}`, { 
        method: "PUT", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.ok) {
        console.error("Erro ao salvar automaticamente:", data);
      }
    } catch (error) {
      console.error("Erro ao salvar automaticamente:", error);
    }
  }

  async function onSubmit(values:any) {
    try {
      // Processar acionamento dos checkboxes
      const acionamentos: string[] = [];
      if (acionamentoManual) acionamentos.push("Manual");
      if (acionamentoAutomatico) acionamentos.push("Automático");
      const acionamentoValue = acionamentos.length > 0 ? acionamentos.join(",") : null;
      
      // Obter valores atuais do formulário (garantir que pegamos os valores mais recentes)
      const currentValues = getValues();
      
      // Combinar os 3 blocos de imagens em um único array (compatibilidade)
      const todasImagens: string[] = [];
      // Array detalhado com tecidoId
      const imagensDetalhadas: Array<{ url: string; tecidoId: string | null; tipo: string; ordem: number }> = [];
      
      // Foto Principal
      const principal = currentValues.imagemPrincipal || values.imagemPrincipal || [];
      const principalTecidos = currentValues.imagemPrincipalTecido || values.imagemPrincipalTecido || [];
      if (Array.isArray(principal) && principal.length > 0) {
        principal.forEach((url: any, idx: number) => {
          if (url && typeof url === 'string' && url.trim() !== "" && (url.startsWith("http") || url.startsWith("/"))) {
            todasImagens.push(url);
            imagensDetalhadas.push({
              url,
              tecidoId: principalTecidos[idx] || null,
              tipo: "principal",
              ordem: 0,
            });
          }
        });
      }
      
      // Fotos Complementares
      const complementares = currentValues.imagensComplementares || values.imagensComplementares || [];
      const complementaresTecidos = currentValues.imagensComplementaresTecido || values.imagensComplementaresTecido || [];
      if (Array.isArray(complementares) && complementares.length > 0) {
        complementares.forEach((url: any, idx: number) => {
          if (url && typeof url === 'string' && url.trim() !== "" && (url.startsWith("http") || url.startsWith("/"))) {
            todasImagens.push(url);
            imagensDetalhadas.push({
              url,
              tecidoId: complementaresTecidos[idx] || null,
              tipo: "complementar",
              ordem: idx,
            });
          }
        });
      }
      
      // Fotos Extra
      const extra = currentValues.imagensExtra || values.imagensExtra || [];
      const extraTecidos = currentValues.imagensExtraTecido || values.imagensExtraTecido || [];
      if (Array.isArray(extra) && extra.length > 0) {
        extra.forEach((url: any, idx: number) => {
          if (url && typeof url === 'string' && url.trim() !== "" && (url.startsWith("http") || url.startsWith("/"))) {
            todasImagens.push(url);
            imagensDetalhadas.push({
              url,
              tecidoId: extraTecidos[idx] || null,
              tipo: "extra",
              ordem: idx,
            });
          }
        });
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
        possuiLados: values.possuiLados ?? false,
        configuracao: values.configuracao || null,
        informacoesAdicionais: values.informacoesAdicionais?.trim() || null,
        imagens: todasImagens, // Mantido para compatibilidade
        imagensDetalhadas: imagensDetalhadas, // Novo formato com tecidoId
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
        // Atualizar a página sem redirecionar
        router.refresh();
        alert("Produto salvo com sucesso!");
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
          <Controller
            name="categoriaId"
            control={control}
            rules={{
              required: "Selecione uma categoria",
              validate: (value) => {
                if (!value || value === "") {
                  return "Selecione uma categoria";
                }
                return true;
              }
            }}
            defaultValue={item.categoriaId || ""}
            render={({ field }) => (
              <select 
                {...field}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione...</option>
                {categorias.map((c:any)=>(<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
            )}
          />
          {errors.categoriaId && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.categoriaId.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Família</label>
          <Controller
            name="familiaId"
            control={control}
            rules={{
              required: "Selecione uma família",
              validate: (value) => {
                if (!value || value === "") {
                  return "Selecione uma família";
                }
                return true;
              }
            }}
            defaultValue={item.familiaId || ""}
            render={({ field }) => (
              <select 
                {...field}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione...</option>
                {familiasFiltradas.map((f:any)=>(<option key={f.id} value={f.id}>{f.nome}</option>))}
              </select>
            )}
          />
          {errors.familiaId && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.familiaId.message)}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nome <span className="text-red-500">*</span></label>
          <Controller
            name="nome"
            control={control}
            rules={{
              required: "Selecione um nome padrão",
              validate: (value) => {
                if (!value || value === "") {
                  return "Selecione um nome padrão";
                }
                // Verificar se o nome atual do produto está na lista (pode estar desativado)
                const nomeAtualValido = item.nome === value;
                const nomeValido = nomesPadrao.some((n: any) => n.nome === value);
                if (!nomeAtualValido && !nomeValido) {
                  return "Selecione um nome padrão válido da lista";
                }
                return true;
              }
            }}
            defaultValue={item.nome || ""}
            render={({ field }) => (
              <select 
                {...field}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" 
              >
                <option value="">Selecione um nome padrão...</option>
                {/* Mostrar o nome atual mesmo que não esteja na lista (pode estar desativado) */}
                {item.nome && !nomesPadrao.some((n: any) => n.nome === item.nome) && (
                  <option value={item.nome}>{item.nome} (atual)</option>
                )}
                {nomesPadrao.map((nome: any) => (
                  <option key={nome.id} value={nome.nome}>
                    {nome.nome}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.nome && <p className="mt-2 text-sm font-medium text-red-600">{String(errors.nome.message)}</p>}
          {nomesPadrao.length === 0 && (
            <p className="mt-2 text-sm text-yellow-600">
              ⚠️ Nenhum nome padrão ativo encontrado. <Link href="/admin/nomes-padrao-produto/new" className="text-primary underline">Cadastre nomes padrões primeiro</Link>.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
          <select {...register("tipo")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Selecione...</option>
            <option value="INTEIRO">INTEIRO</option>
            <option value="MODULAR">MODULAR</option>
            <option value="BIPARTIDO">BIPARTIDO</option>
            <option value="GIRATORIO">GIRATORIO</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Abertura</label>
          <select {...register("abertura")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
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
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
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
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
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
          <input {...register("configuracao")} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" placeholder="ex.: Módulo com braço" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Configuração para Informações Adicionais</label>
          <textarea
            {...register("informacoesAdicionais")}
            rows={5}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Informações específicas do produto (estrutura, espumas, garantia, etc.). Exibidas na página do produto abaixo da Descrição."
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Imagens</label>
          <ProdutoImagensBlocos
            control={control}
            watch={watch}
            setValue={setValue}
            uploading={uploading}
            setUploading={setUploading}
            fileInputRef={fileInputRef}
            tecidos={tecidos}
            onAutoSave={handleAutoSave}
            produtoId={item.id}
          />
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="status" 
            {...register("status", { 
              setValueAs: (value) => Boolean(value)
            })} 
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary" 
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
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-domux-burgundy-dark disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </FormShell>
  );
}

