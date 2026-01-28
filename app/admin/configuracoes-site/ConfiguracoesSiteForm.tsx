"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";

interface Categoria {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  categoria: { nome: string };
  familia: { nome: string };
}

interface ProdutoTabela {
  id: string;
  nome: string;
  categoria: { id: string; nome: string };
  familia: { id: string; nome: string };
}

interface TabelaPreco {
  id: string;
  nome: string;
  descricao: string | null;
}

interface SiteConfig {
  id: string;
  categoriasDestaque: string[];
  produtosDestaque: string[];
  tabelaPrecoVigenteId: string | null;
  produtosAtivosTabelaVigente: string[];
  descontosProdutosDestaque?: Record<string, number> | null;
  ordemCategorias: string[];
  tabelaPrecoVigente: TabelaPreco | null;
  heroTipo?: string | null;
  heroTitulo?: string | null;
  heroSubtitulo?: string | null;
  heroBotaoTexto?: string | null;
  heroBotaoLink?: string | null;
  heroImagemUrl?: string | null;
  heroImagemLink?: string | null;
  heroImagemObjectFit?: string | null;
  heroImagemObjectPosition?: string | null;
  logoUrl?: string | null;
  filtrosAtivos?: boolean;
  filtrosTitulo?: boolean;
  filtrosAplicados?: boolean;
  filtroCategoriaAtivo?: boolean;
  filtroCategoriaNome?: string | null;
  filtroCategoriaCategorias?: string[];
  filtroPrecoAtivo?: boolean;
  filtroPrecoNome?: string | null;
  filtroOpcoesProdutoAtivo?: boolean;
  filtroOpcoesProdutoNome?: string | null;
  rodapeTitulo?: string | null;
  rodapeDescricao?: string | null;
  rodapeContato?: string | null;
  rodapeCopyright?: string | null;
}

interface Props {
  siteConfig: SiteConfig;
  categorias: Categoria[];
  produtos: Produto[];
  tabelasPreco: TabelaPreco[];
}

export default function ConfiguracoesSiteForm({
  siteConfig,
  categorias,
  produtos,
  tabelasPreco,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>(
    siteConfig.categoriasDestaque || []
  );
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>(
    siteConfig.produtosDestaque || []
  );
  const [tabelaPrecoSelecionada, setTabelaPrecoSelecionada] = useState<string>(
    siteConfig.tabelaPrecoVigenteId || ""
  );
  const [produtosTabelaVigente, setProdutosTabelaVigente] = useState<ProdutoTabela[]>([]);
  const [produtosAtivosTabelaVigente, setProdutosAtivosTabelaVigente] = useState<string[]>(
    siteConfig.produtosAtivosTabelaVigente || []
  );
  const [loadingProdutosTabela, setLoadingProdutosTabela] = useState(false);
  const [descontosProdutosDestaque, setDescontosProdutosDestaque] = useState<Record<string, number>>(
    (siteConfig.descontosProdutosDestaque as Record<string, number>) || {}
  );
  const [heroTipo, setHeroTipo] = useState<string>(siteConfig.heroTipo || "texto");
  const [heroTitulo, setHeroTitulo] = useState<string>(siteConfig.heroTitulo || "Sofás sob medida com o conforto que você merece");
  const [heroSubtitulo, setHeroSubtitulo] = useState<string>(siteConfig.heroSubtitulo || "Escolha seu modelo, tecido e medida ideal. Personalize seu sofá do jeito que você sempre sonhou.");
  const [heroBotaoTexto, setHeroBotaoTexto] = useState<string>(siteConfig.heroBotaoTexto || "Ver Catálogo");
  const [heroBotaoLink, setHeroBotaoLink] = useState<string>(siteConfig.heroBotaoLink || "/categorias");
  const [heroImagemUrl, setHeroImagemUrl] = useState<string>(siteConfig.heroImagemUrl || "");
  const [heroImagemLink, setHeroImagemLink] = useState<string>((siteConfig as any).heroImagemLink || "");
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>((siteConfig as any).logoUrl || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // Detectar se o posicionamento é customizado (formato "50% 50%")
  const savedPosition = (siteConfig as any).heroImagemObjectPosition || "center";
  const isCustomPosition = /^\d+%\s+\d+%$/.test(savedPosition);
  const initialCustomPosition = isCustomPosition 
    ? {
        x: savedPosition.split(" ")[0].replace("%", ""),
        y: savedPosition.split(" ")[1].replace("%", ""),
      }
    : { x: "50", y: "50" };

  const [heroImagemObjectFit, setHeroImagemObjectFit] = useState<string>(
    (siteConfig as any).heroImagemObjectFit || "cover"
  );
  const [heroImagemObjectPosition, setHeroImagemObjectPosition] = useState<string>(
    isCustomPosition ? "center" : savedPosition
  );
  const [customPosition, setCustomPosition] = useState<{ x: string; y: string }>(initialCustomPosition);
  const [useCustomPosition, setUseCustomPosition] = useState(isCustomPosition);
  
  // Estados para configuração de filtros
  const [filtrosAtivos, setFiltrosAtivos] = useState<boolean>((siteConfig as any).filtrosAtivos !== undefined ? (siteConfig as any).filtrosAtivos : true);
  const [filtrosTitulo, setFiltrosTitulo] = useState<boolean>((siteConfig as any).filtrosTitulo !== undefined ? (siteConfig as any).filtrosTitulo : true);
  const [filtrosAplicados, setFiltrosAplicados] = useState<boolean>((siteConfig as any).filtrosAplicados !== undefined ? (siteConfig as any).filtrosAplicados : true);
  const [filtroCategoriaAtivo, setFiltroCategoriaAtivo] = useState<boolean>((siteConfig as any).filtroCategoriaAtivo !== undefined ? (siteConfig as any).filtroCategoriaAtivo : true);
  const [filtroCategoriaNome, setFiltroCategoriaNome] = useState<string>((siteConfig as any).filtroCategoriaNome || "Categoria");
  const [filtroCategoriaCategorias, setFiltroCategoriaCategorias] = useState<string[]>((siteConfig as any).filtroCategoriaCategorias || []);
  const [filtroPrecoAtivo, setFiltroPrecoAtivo] = useState<boolean>((siteConfig as any).filtroPrecoAtivo !== undefined ? (siteConfig as any).filtroPrecoAtivo : true);
  const [filtroPrecoNome, setFiltroPrecoNome] = useState<string>((siteConfig as any).filtroPrecoNome || "Preço");
  const [filtroOpcoesProdutoAtivo, setFiltroOpcoesProdutoAtivo] = useState<boolean>((siteConfig as any).filtroOpcoesProdutoAtivo !== undefined ? (siteConfig as any).filtroOpcoesProdutoAtivo : true);
  const [filtroOpcoesProdutoNome, setFiltroOpcoesProdutoNome] = useState<string>((siteConfig as any).filtroOpcoesProdutoNome || "Opções de Produto");
  const [editingFiltroCategoria, setEditingFiltroCategoria] = useState(false);
  const [rodapeTitulo, setRodapeTitulo] = useState<string>((siteConfig as any).rodapeTitulo ?? "AI Sofá");
  const [rodapeDescricao, setRodapeDescricao] = useState<string>((siteConfig as any).rodapeDescricao ?? "Sofás sob medida com o conforto que você merece. Qualidade, estilo e personalização em cada detalhe.");
  const [rodapeContato, setRodapeContato] = useState<string>((siteConfig as any).rodapeContato ?? "Entre em contato conosco através do canal de mensagens do seu pedido. Estamos sempre prontos para ajudar.");
  const [rodapeCopyright, setRodapeCopyright] = useState<string>((siteConfig as any).rodapeCopyright ?? "© {ano} AI Sofá. Todos os direitos reservados.");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/configuracoes-site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoriasDestaque: categoriasSelecionadas,
          produtosDestaque: produtosSelecionados,
          tabelaPrecoVigenteId: tabelaPrecoSelecionada || null,
          produtosAtivosTabelaVigente: produtosAtivosTabelaVigente,
          descontosProdutosDestaque: descontosProdutosDestaque,
          ordemCategorias: categoriasSelecionadas, // Por enquanto, ordem = ordem de seleção
          heroTipo: heroTipo,
          heroTitulo: heroTipo === "texto" ? heroTitulo : null,
          heroSubtitulo: heroTipo === "texto" ? heroSubtitulo : null,
          heroBotaoTexto: heroTipo === "texto" ? heroBotaoTexto : null,
          heroBotaoLink: heroTipo === "texto" ? heroBotaoLink : null,
          heroImagemUrl: heroTipo === "imagem" ? heroImagemUrl : null,
          heroImagemLink: heroTipo === "imagem" ? heroImagemLink : null,
          heroImagemObjectFit: heroTipo === "imagem" ? heroImagemObjectFit : null,
          heroImagemObjectPosition: heroTipo === "imagem" 
            ? (useCustomPosition ? `${customPosition.x}% ${customPosition.y}%` : heroImagemObjectPosition)
            : null,
          logoUrl: logoUrl || null,
          filtrosAtivos,
          filtrosTitulo,
          filtrosAplicados,
          filtroCategoriaAtivo,
          filtroCategoriaNome: filtroCategoriaNome || null,
          filtroCategoriaCategorias,
          filtroPrecoAtivo,
          filtroPrecoNome: filtroPrecoNome || null,
          filtroOpcoesProdutoAtivo,
          filtroOpcoesProdutoNome: filtroOpcoesProdutoNome || null,
          rodapeTitulo: rodapeTitulo || null,
          rodapeDescricao: rodapeDescricao || null,
          rodapeContato: rodapeContato || null,
          rodapeCopyright: rodapeCopyright || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || "Erro ao salvar configurações");
      }

      router.refresh();
      alert("Configurações salvas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      const errorMessage = error?.message || "Erro ao salvar configurações. Tente novamente.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoria = (categoriaId: string) => {
    setCategoriasSelecionadas((prev) =>
      prev.includes(categoriaId)
        ? prev.filter((id) => id !== categoriaId)
        : [...prev, categoriaId]
    );
  };

  const toggleProduto = (produtoId: string) => {
    setProdutosSelecionados((prev) => {
      const newList = prev.includes(produtoId)
        ? prev.filter((id) => id !== produtoId)
        : [...prev, produtoId];
      
      // Se produto foi removido, remover também o desconto
      if (prev.includes(produtoId) && !newList.includes(produtoId)) {
        setDescontosProdutosDestaque((prevDescontos) => {
          const newDescontos = { ...prevDescontos };
          delete newDescontos[produtoId];
          return newDescontos;
        });
      }
      
      return newList;
    });
  };

  const atualizarDesconto = (produtoId: string, desconto: number) => {
    setDescontosProdutosDestaque((prev) => ({
      ...prev,
      [produtoId]: desconto > 0 ? desconto : 0,
    }));
  };

  const toggleProdutoTabelaVigente = (produtoId: string) => {
    setProdutosAtivosTabelaVigente((prev) =>
      prev.includes(produtoId)
        ? prev.filter((id) => id !== produtoId)
        : [...prev, produtoId]
    );
  };

  // Carregar produtos da tabela quando uma tabela for selecionada
  useEffect(() => {
    const carregarProdutosTabela = async () => {
      if (!tabelaPrecoSelecionada) {
        setProdutosTabelaVigente([]);
        setProdutosAtivosTabelaVigente([]);
        return;
      }

      setLoadingProdutosTabela(true);
      try {
        const response = await fetch(`/api/tabelas-preco/${tabelaPrecoSelecionada}/produtos`);
        const data = await response.json();
        
        if (data.ok && data.data?.produtos) {
          setProdutosTabelaVigente(data.data.produtos);
          // Se a tabela selecionada for a mesma que está salva no siteConfig, manter produtos ativos
          // Caso contrário, limpar produtos ativos
          if (tabelaPrecoSelecionada === siteConfig.tabelaPrecoVigenteId && siteConfig.produtosAtivosTabelaVigente?.length > 0) {
            // Manter apenas produtos que existem na nova lista de produtos da tabela
            const produtosValidos = siteConfig.produtosAtivosTabelaVigente.filter(id => 
              data.data.produtos.some((p: ProdutoTabela) => p.id === id)
            );
            setProdutosAtivosTabelaVigente(produtosValidos);
          } else {
            setProdutosAtivosTabelaVigente([]);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar produtos da tabela:", error);
        setProdutosTabelaVigente([]);
        setProdutosAtivosTabelaVigente([]);
      } finally {
        setLoadingProdutosTabela(false);
      }
    };

    carregarProdutosTabela();
  }, [tabelaPrecoSelecionada, siteConfig.tabelaPrecoVigenteId, siteConfig.produtosAtivosTabelaVigente]);

  // Filtrar produtos disponíveis para destaques baseado nos produtos ativos da tabela vigente
  const produtosDisponiveisDestaque = useMemo(() => {
    // Se não houver tabela vigente selecionada, não mostrar nenhum produto
    if (!tabelaPrecoSelecionada) {
      return [];
    }
    
    // Se não houver produtos ativos selecionados, não mostrar nenhum produto
    if (produtosAtivosTabelaVigente.length === 0) {
      return [];
    }

    // Filtrar produtos que estão na lista de produtos ativos da tabela vigente
    return produtos.filter((produto) => 
      produtosAtivosTabelaVigente.includes(produto.id)
    );
  }, [produtos, produtosAtivosTabelaVigente, tabelaPrecoSelecionada]);

  // Limpar produtos em destaque que não estão mais na lista de produtos ativos
  useEffect(() => {
    if (produtosDisponiveisDestaque.length > 0) {
      const produtosValidos = produtosSelecionados.filter(id => 
        produtosDisponiveisDestaque.some(p => p.id === id)
      );
      if (produtosValidos.length !== produtosSelecionados.length) {
        setProdutosSelecionados(produtosValidos);
      }
    } else if (produtosSelecionados.length > 0) {
      // Se não houver produtos disponíveis, limpar seleção
      setProdutosSelecionados([]);
    }
  }, [produtosDisponiveisDestaque]);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingHeroImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/imagem", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.ok && data.data?.url) {
        setHeroImagemUrl(data.data.url);
        alert("Imagem enviada com sucesso!");
      } else {
        const errorMsg = data.error || data.details || "Erro ao fazer upload";
        alert(`Erro ao fazer upload: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload. Verifique o console para mais detalhes.");
    } finally {
      setUploadingHeroImage(false);
      e.target.value = "";
    }
  };

  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      alert("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou SVG.");
      e.target.value = "";
      return;
    }

    // Validar tamanho (máximo 2MB para logo)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      alert("Arquivo muito grande. Tamanho máximo: 2MB.");
      e.target.value = "";
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/imagem", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.ok && data.data?.url) {
        setLogoUrl(data.data.url);
        alert("Logo enviado com sucesso!");
      } else {
        const errorMsg = data.error || data.details || "Erro ao fazer upload";
        alert(`Erro ao fazer upload: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      alert("Erro ao fazer upload. Verifique o console para mais detalhes.");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Seção: Logo da Empresa */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Logo da Empresa
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Faça upload do logo da empresa que será exibido no cabeçalho do site.
        </p>
        <div className="mb-4">
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {uploadingLogo ? "Enviando..." : logoUrl ? "Trocar Logo" : "Selecionar Logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl("")}
                className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Remover Logo
              </button>
            )}
          </div>
          {logoUrl && (
            <div className="mt-4">
              <img
                src={logoUrl}
                alt="Preview do Logo"
                className="max-h-20 rounded-lg border border-gray-200 object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* Seção: Hero/Banner da Página Inicial */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Hero/Banner da Página Inicial
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Configure o banner principal da página inicial. Você pode escolher entre exibir texto personalizado ou uma imagem.
        </p>

        {/* Tipo de Hero */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Tipo de Hero
          </label>
          <div className="flex gap-4">
            <label className="flex cursor-pointer items-center">
              <input
                type="radio"
                name="heroTipo"
                value="texto"
                checked={heroTipo === "texto"}
                onChange={(e) => setHeroTipo(e.target.value)}
                className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Texto Personalizado</span>
            </label>
            <label className="flex cursor-pointer items-center">
              <input
                type="radio"
                name="heroTipo"
                value="imagem"
                checked={heroTipo === "imagem"}
                onChange={(e) => setHeroTipo(e.target.value)}
                className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Imagem</span>
            </label>
          </div>
        </div>

        {heroTipo === "texto" ? (
          <>
            {/* Título */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Título Principal
              </label>
              <input
                type="text"
                value={heroTitulo}
                onChange={(e) => setHeroTitulo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sofás sob medida com o conforto que você merece"
              />
            </div>

            {/* Subtítulo */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subtítulo/Descrição
              </label>
              <textarea
                value={heroSubtitulo}
                onChange={(e) => setHeroSubtitulo(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escolha seu modelo, tecido e medida ideal. Personalize seu sofá do jeito que você sempre sonhou."
              />
            </div>

            {/* Botão */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Texto do Botão
                </label>
                <input
                  type="text"
                  value={heroBotaoTexto}
                  onChange={(e) => setHeroBotaoTexto(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ver Catálogo"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Link do Botão
                </label>
                <input
                  type="text"
                  value={heroBotaoLink}
                  onChange={(e) => setHeroBotaoLink(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/categorias"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Upload de Imagem */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Imagem do Hero
              </label>
              <input
                ref={heroImageInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleHeroImageUpload}
                className="hidden"
              />
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => heroImageInputRef.current?.click()}
                  disabled={uploadingHeroImage}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {uploadingHeroImage ? "Enviando..." : heroImagemUrl ? "Trocar Imagem" : "Selecionar Imagem"}
                </button>
                {heroImagemUrl && (
                  <button
                    type="button"
                    onClick={() => setHeroImagemUrl("")}
                    className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Remover Imagem
                  </button>
                )}
              </div>
              {heroImagemUrl && (
                <>
                  <div className="mt-4">
                    <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-100" style={{ height: "300px" }}>
                      <img
                        src={heroImagemUrl}
                        alt="Preview do Hero"
                        className="h-full w-full"
                        style={{
                          objectFit: heroImagemObjectFit as any,
                          objectPosition: useCustomPosition 
                            ? `${customPosition.x}% ${customPosition.y}%` 
                            : heroImagemObjectPosition,
                        }}
                      />
                    </div>
                  </div>

                  {/* Link de Clique da Imagem */}
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Link de Clique da Imagem (Opcional)
                    </label>
                    <input
                      type="text"
                      value={heroImagemLink}
                      onChange={(e) => setHeroImagemLink(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/categorias ou https://exemplo.com"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Se preenchido, a imagem será clicável e redirecionará para este link. Deixe em branco para imagem não clicável.
                    </p>
                  </div>

                  {/* Controles de Ajuste */}
                  <div className="mt-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h3 className="text-sm font-semibold text-gray-900">Ajustes da Imagem</h3>
                    
                    {/* Modo de Ajuste (Object Fit) */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Modo de Ajuste
                      </label>
                      <select
                        value={heroImagemObjectFit}
                        onChange={(e) => setHeroImagemObjectFit(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="cover">Cobrir (Cover) - Preenche o espaço mantendo proporção</option>
                        <option value="contain">Conter (Contain) - Mostra imagem completa</option>
                        <option value="fill">Preencher (Fill) - Estica para preencher espaço</option>
                        <option value="none">Nenhum (None) - Tamanho original</option>
                        <option value="scale-down">Reduzir (Scale-down) - Como none ou contain, o menor</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        {heroImagemObjectFit === "cover" && "A imagem preenche todo o espaço, cortando se necessário"}
                        {heroImagemObjectFit === "contain" && "A imagem inteira é exibida, pode deixar espaços vazios"}
                        {heroImagemObjectFit === "fill" && "A imagem é esticada para preencher todo o espaço"}
                        {heroImagemObjectFit === "none" && "A imagem mantém seu tamanho original"}
                        {heroImagemObjectFit === "scale-down" && "A imagem é reduzida se necessário, mas não ampliada"}
                      </p>
                    </div>

                    {/* Posicionamento */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Posicionamento da Imagem
                      </label>
                      <div className="mb-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={useCustomPosition}
                            onChange={(e) => setUseCustomPosition(e.target.checked)}
                            className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Usar posicionamento customizado</span>
                        </label>
                      </div>
                      
                      {!useCustomPosition ? (
                        <select
                          value={heroImagemObjectPosition}
                          onChange={(e) => setHeroImagemObjectPosition(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="center">Centro</option>
                          <option value="top">Topo</option>
                          <option value="bottom">Inferior</option>
                          <option value="left">Esquerda</option>
                          <option value="right">Direita</option>
                          <option value="top left">Topo Esquerda</option>
                          <option value="top right">Topo Direita</option>
                          <option value="bottom left">Inferior Esquerda</option>
                          <option value="bottom right">Inferior Direita</option>
                        </select>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-xs text-gray-600">Posição Horizontal (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={customPosition.x}
                              onChange={(e) => setCustomPosition({ ...customPosition, x: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-600">Posição Vertical (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={customPosition.y}
                              onChange={(e) => setCustomPosition({ ...customPosition, y: e.target.value })}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Seção: Tabela de Preço Vigente */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Tabela de Preço Vigente
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Selecione qual tabela de preço está ativa no momento para exibição no site
        </p>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center rounded-lg border border-gray-200 bg-white p-3 hover:border-gray-300">
            <input
              type="radio"
              name="tabelaPreco"
              value=""
              checked={tabelaPrecoSelecionada === ""}
              onChange={(e) => setTabelaPrecoSelecionada(e.target.value)}
              className="mr-3 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                Nenhuma (usar padrão)
              </span>
            </div>
          </label>
          {tabelasPreco.map((tabela) => (
            <label
              key={tabela.id}
              className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                tabelaPrecoSelecionada === tabela.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="tabelaPreco"
                value={tabela.id}
                checked={tabelaPrecoSelecionada === tabela.id}
                onChange={(e) => setTabelaPrecoSelecionada(e.target.value)}
                className="mr-3 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {tabela.nome}
                </span>
                {tabela.descricao && (
                  <p className="mt-1 text-xs text-gray-500">{tabela.descricao}</p>
                )}
              </div>
            </label>
          ))}
        </div>
        {tabelaPrecoSelecionada && (
          <p className="mt-4 text-sm text-gray-500">
            Tabela selecionada:{" "}
            {tabelasPreco.find((t) => t.id === tabelaPrecoSelecionada)?.nome}
          </p>
        )}
      </div>

      {/* Seção: Produtos Ativos da Tabela Vigente */}
      {tabelaPrecoSelecionada && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Produtos Ativos da Tabela Vigente
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Selecione quais produtos da tabela de preço vigente estarão disponíveis no site
          </p>
          {loadingProdutosTabela ? (
            <div className="py-8 text-center text-gray-500">
              Carregando produtos...
            </div>
          ) : produtosTabelaVigente.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Nenhum produto encontrado nesta tabela
            </div>
          ) : (
            <>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {produtosTabelaVigente.map((produto) => {
                  const isSelected = produtosAtivosTabelaVigente.includes(produto.id);
                  return (
                    <label
                      key={produto.id}
                      className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProdutoTabelaVigente(produto.id)}
                        className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">
                          {produto.nome}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {produto.categoria.nome} / {produto.familia.nome}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
              {produtosAtivosTabelaVigente.length > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  {produtosAtivosTabelaVigente.length} produto(s) ativo(s) selecionado(s)
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Seção: Produtos em Destaque */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Produtos em Destaque
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          {tabelaPrecoSelecionada && produtosAtivosTabelaVigente.length > 0
            ? "Selecione os produtos que aparecerão na seção \"Produtos em Destaque\" da página inicial (apenas produtos ativos da tabela vigente)"
            : tabelaPrecoSelecionada
            ? "Selecione primeiro os produtos ativos da tabela vigente acima"
            : "Selecione primeiro uma tabela de preço vigente acima"}
        </p>
        {!tabelaPrecoSelecionada ? (
          <div className="py-8 text-center text-gray-500">
            Selecione uma tabela de preço vigente para habilitar a seleção de produtos em destaque
          </div>
        ) : produtosAtivosTabelaVigente.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Selecione produtos ativos da tabela vigente acima para habilitar a seleção de produtos em destaque
          </div>
        ) : produtosDisponiveisDestaque.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Nenhum produto disponível para destaques
          </div>
        ) : (
          <>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {produtosDisponiveisDestaque.map((produto) => {
                const isSelected = produtosSelecionados.includes(produto.id);
                const descontoAtual = descontosProdutosDestaque[produto.id] || 0;
                return (
                  <div
                    key={produto.id}
                    className={`rounded-lg border p-3 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center">
                      <label className="flex cursor-pointer items-center flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProduto(produto.id)}
                          className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">
                            {produto.nome}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {produto.categoria.nome} / {produto.familia.nome}
                          </span>
                        </div>
                      </label>
                      {isSelected && (
                        <div className="ml-4 flex items-center gap-2">
                          <label className="text-xs text-gray-600 whitespace-nowrap">
                            Desconto (%):
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={descontoAtual}
                            onChange={(e) => {
                              const valor = parseFloat(e.target.value) || 0;
                              atualizarDesconto(produto.id, Math.max(0, Math.min(100, valor)));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {produtosSelecionados.length > 0 && (
              <p className="mt-4 text-sm text-gray-500">
                {produtosSelecionados.length} produto(s) selecionado(s)
              </p>
            )}
          </>
        )}
      </div>

      {/* Seção: Categorias em Destaque */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Categorias em Destaque
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Selecione as categorias que aparecerão na página inicial do site
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categorias.map((categoria) => {
            const isSelected = categoriasSelecionadas.includes(categoria.id);
            return (
              <label
                key={categoria.id}
                className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleCategoria(categoria.id)}
                  className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-900">
                  {categoria.nome}
                </span>
              </label>
            );
          })}
        </div>
        {categoriasSelecionadas.length > 0 && (
          <p className="mt-4 text-sm text-gray-500">
            {categoriasSelecionadas.length} categoria(s) selecionada(s)
          </p>
        )}
      </div>

      {/* Seção: Configuração de Filtros */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Configuração de Filtros
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Configure quais filtros serão exibidos nas páginas de produtos e categorias
        </p>

        {/* Configurações Gerais */}
        <div className="mb-6 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-lg font-medium text-gray-900">Configurações Gerais</h3>
          
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={filtrosAtivos}
              onChange={(e) => setFiltrosAtivos(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Mostrar filtros nas páginas de produtos
            </span>
          </label>

          {filtrosAtivos && (
            <>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filtrosTitulo}
                  onChange={(e) => setFiltrosTitulo(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mostrar título "Filtros" ou "Filtrar por"
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filtrosAplicados}
                  onChange={(e) => setFiltrosAplicados(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mostrar texto "Filtros aplicados"
                </span>
              </label>
            </>
          )}
        </div>

        {/* Filtro de Categoria */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-gray-900">Filtrar por Categoria</h3>
              <button
                type="button"
                onClick={() => setFiltroCategoriaAtivo(!filtroCategoriaAtivo)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  filtroCategoriaAtivo
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filtroCategoriaAtivo ? "Ativo" : "Oculto"}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingFiltroCategoria(!editingFiltroCategoria)}
                className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
              >
                {editingFiltroCategoria ? "Cancelar" : "Editar"}
              </button>
            </div>
          </div>

          {editingFiltroCategoria && (
            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nome do Filtro (Opcional)
                </label>
                <input
                  type="text"
                  value={filtroCategoriaNome}
                  onChange={(e) => setFiltroCategoriaNome(e.target.value)}
                  placeholder="Categoria"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Selecionar Categorias para o Filtro
                </label>
                <p className="mb-3 text-xs text-gray-500">
                  Deixe vazio para exibir todas as categorias. Selecione categorias específicas para limitar o filtro.
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
                  {categorias.map((categoria) => {
                    const isSelected = filtroCategoriaCategorias.includes(categoria.id);
                    return (
                      <label
                        key={categoria.id}
                        className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFiltroCategoriaCategorias([...filtroCategoriaCategorias, categoria.id]);
                            } else {
                              setFiltroCategoriaCategorias(filtroCategoriaCategorias.filter(id => id !== categoria.id));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{categoria.nome}</span>
                      </label>
                    );
                  })}
                </div>
                {filtroCategoriaCategorias.length === 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    Nenhuma categoria selecionada - todas as categorias serão exibidas
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filtro de Preço */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-gray-900">Filtrar por Preço</h3>
              <button
                type="button"
                onClick={() => setFiltroPrecoAtivo(!filtroPrecoAtivo)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  filtroPrecoAtivo
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filtroPrecoAtivo ? "Ativo" : "Oculto"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const nomeAtual = filtroPrecoNome || "Preço";
                const novoNome = prompt("Edite o nome do filtro de preço:", nomeAtual);
                if (novoNome !== null) {
                  setFiltroPrecoNome(novoNome);
                }
              }}
              className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              Editar Nome
            </button>
          </div>
        </div>

        {/* Filtro de Opções de Produto */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-gray-900">Filtrar por Opções de Produto</h3>
              <button
                type="button"
                onClick={() => setFiltroOpcoesProdutoAtivo(!filtroOpcoesProdutoAtivo)}
                className={`rounded px-3 py-1 text-xs font-medium ${
                  filtroOpcoesProdutoAtivo
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filtroOpcoesProdutoAtivo ? "Ativo" : "Oculto"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const nomeAtual = filtroOpcoesProdutoNome || "Opções de Produto";
                const novoNome = prompt("Edite o nome do filtro de opções de produto:", nomeAtual);
                if (novoNome !== null) {
                  setFiltroOpcoesProdutoNome(novoNome);
                }
              }}
              className="rounded px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
            >
              Editar Nome
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Observação: você não pode selecionar quais opções de produto exibir. Você pode exibir todas ou ocultá-las todas.
          </p>
        </div>
      </div>

      {/* Seção: Customização do Rodapé */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Rodapé da Página
        </h2>
        <p className="mb-6 text-sm text-gray-600">
          Personalize os textos exibidos no rodapé do site (nome da marca, descrição, contato e copyright).
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Título / Nome da marca
            </label>
            <input
              type="text"
              value={rodapeTitulo}
              onChange={(e) => setRodapeTitulo(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="AI Sofá"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Descrição (coluna Sobre)
            </label>
            <textarea
              value={rodapeDescricao}
              onChange={(e) => setRodapeDescricao(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Sofás sob medida com o conforto que você merece..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Texto da coluna Contato
            </label>
            <textarea
              value={rodapeContato}
              onChange={(e) => setRodapeContato(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Entre em contato conosco..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Copyright
            </label>
            <input
              type="text"
              value={rodapeCopyright}
              onChange={(e) => setRodapeCopyright(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="© {ano} AI Sofá. Todos os direitos reservados."
            />
            <p className="mt-1 text-xs text-gray-500">
              Use {"{ano}"} no texto para exibir o ano atual automaticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </form>
  );
}

