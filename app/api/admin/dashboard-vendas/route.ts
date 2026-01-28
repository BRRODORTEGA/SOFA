import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

// Ordem do funil (fluxo típico do pedido)
const ORDEM_STATUS_FUNIL = [
  "Solicitado",
  "Aguardando Pagamento",
  "Pagamento Aprovado",
  "Aprovado",
  "Em Produção",
  "Em Expedição",
  "Em Transporte",
  "Entregue",
  "Reprovado",
];

export async function GET(req: Request) {
  await requireAdminSession();

  try {
    const { searchParams } = new URL(req.url);
    const mesParam = searchParams.get("mes"); // "YYYY-MM"
    const deParam = searchParams.get("de");   // "YYYY-MM-DD"
    const ateParam = searchParams.get("ate"); // "YYYY-MM-DD"

    let inicioPeriodo: Date;
    let fimPeriodo: Date;
    let mesReferencia: string;

    if (deParam && ateParam && /^\d{4}-\d{2}-\d{2}$/.test(deParam) && /^\d{4}-\d{2}-\d{2}$/.test(ateParam)) {
      const de = new Date(deParam + "T00:00:00");
      const ate = new Date(ateParam + "T23:59:59.999");
      if (de.getTime() <= ate.getTime()) {
        inicioPeriodo = de;
        fimPeriodo = ate;
        mesReferencia = `de ${deParam} até ${ateParam}`;
      } else {
        const now = new Date();
        inicioPeriodo = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        fimPeriodo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        mesReferencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      }
    } else if (mesParam && /^\d{4}-\d{2}$/.test(mesParam)) {
      const [y, m] = mesParam.split("-").map(Number);
      inicioPeriodo = new Date(y, m - 1, 1, 0, 0, 0);
      fimPeriodo = new Date(y, m, 0, 23, 59, 59);
      mesReferencia = mesParam;
    } else {
      const now = new Date();
      inicioPeriodo = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      fimPeriodo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      mesReferencia = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: { gte: inicioPeriodo, lte: fimPeriodo },
      },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                categoria: { select: { id: true, nome: true } },
                familia: { select: { id: true, nome: true } },
              },
            },
            tecido: { select: { id: true, nome: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const valorPedido = (itens: { precoUnit: unknown; quantidade: number }[]) =>
      itens.reduce((s, i) => s + Number(i.precoUnit) * i.quantidade, 0);

    const pedidosComValor = pedidos.map((p) => ({
      ...p,
      valorTotal: valorPedido(p.itens),
    }));

    // Vendas mensais: meses contidos em [inicioPeriodo, fimPeriodo], um por mês
    const vendasMensaisMap = new Map<string, { valor: number; quantidade: number }>();
    let cur = new Date(inicioPeriodo.getFullYear(), inicioPeriodo.getMonth(), 1);
    const fimMes = new Date(fimPeriodo.getFullYear(), fimPeriodo.getMonth(), 1);
    while (cur.getTime() <= fimMes.getTime()) {
      const key = cur.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
      vendasMensaisMap.set(key, { valor: 0, quantidade: 0 });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    pedidosComValor.forEach((p) => {
      const key = new Date(p.createdAt).toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });
      const at = vendasMensaisMap.get(key);
      if (at) {
        at.valor += p.valorTotal;
        at.quantidade += 1;
      }
    });
    const vendasMensais = Array.from(vendasMensaisMap.entries()).map(([mes, d]) => ({
      mes,
      valor: Math.round(d.valor * 100) / 100,
      quantidade: d.quantidade,
    }));

    // Top 10 produtos (por valor)
    const porProduto = new Map<string, { nome: string; valor: number; quantidade: number }>();
    pedidosComValor.forEach((p) => {
      p.itens.forEach((item) => {
        const id = item.produtoId;
        const nome = item.produto?.nome ?? "Produto";
        const v = Number(item.precoUnit) * item.quantidade;
        const at = porProduto.get(id) ?? { nome, valor: 0, quantidade: 0 };
        at.valor += v;
        at.quantidade += item.quantidade;
        porProduto.set(id, at);
      });
    });
    const top10Produtos = Array.from(porProduto.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)
      .map((o) => ({ nome: o.nome, valor: Math.round(o.valor * 100) / 100, quantidade: o.quantidade }));

    // Top 5 famílias (por valor)
    const porFamilia = new Map<string, { nome: string; valor: number; quantidade: number }>();
    pedidosComValor.forEach((p) => {
      p.itens.forEach((item) => {
        const fam = item.produto?.familia;
        const id = fam?.id ?? "_sem";
        const nome = fam?.nome ?? "Sem Família";
        const v = Number(item.precoUnit) * item.quantidade;
        const at = porFamilia.get(id) ?? { nome, valor: 0, quantidade: 0 };
        at.valor += v;
        at.quantidade += item.quantidade;
        porFamilia.set(id, at);
      });
    });
    const top5Familias = Array.from(porFamilia.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
      .map((o) => ({ nome: o.nome, valor: Math.round(o.valor * 100) / 100, quantidade: o.quantidade }));

    // Top 3 categorias (por valor)
    const porCategoria = new Map<string, { nome: string; valor: number; quantidade: number }>();
    pedidosComValor.forEach((p) => {
      p.itens.forEach((item) => {
        const cat = item.produto?.categoria;
        const id = cat?.id ?? "_sem";
        const nome = cat?.nome ?? "Sem Categoria";
        const v = Number(item.precoUnit) * item.quantidade;
        const at = porCategoria.get(id) ?? { nome, valor: 0, quantidade: 0 };
        at.valor += v;
        at.quantidade += item.quantidade;
        porCategoria.set(id, at);
      });
    });
    const top3Categorias = Array.from(porCategoria.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 3)
      .map((o) => ({ nome: o.nome, valor: Math.round(o.valor * 100) / 100, quantidade: o.quantidade }));

    // Top 5 tecidos (por valor)
    const porTecido = new Map<string, { nome: string; valor: number; quantidade: number }>();
    pedidosComValor.forEach((p) => {
      p.itens.forEach((item) => {
        const t = item.tecido;
        const id = t?.id ?? "_sem";
        const nome = t?.nome ?? "Sem Tecido";
        const v = Number(item.precoUnit) * item.quantidade;
        const at = porTecido.get(id) ?? { nome, valor: 0, quantidade: 0 };
        at.valor += v;
        at.quantidade += item.quantidade;
        porTecido.set(id, at);
      });
    });
    const top5Tecidos = Array.from(porTecido.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
      .map((o) => ({ nome: o.nome, valor: Math.round(o.valor * 100) / 100, quantidade: o.quantidade }));

    // Funil por status: listar TODOS os status (quantidade e valor); 0 quando não houver pedido
    const porStatus = new Map<string, { quantidade: number; valor: number }>();
    pedidosComValor.forEach((p) => {
      const s = p.status;
      const at = porStatus.get(s) ?? { quantidade: 0, valor: 0 };
      at.quantidade += 1;
      at.valor += p.valorTotal;
      porStatus.set(s, at);
    });
    const funilStatus = ORDEM_STATUS_FUNIL.map((s) => {
      const d = porStatus.get(s) ?? { quantidade: 0, valor: 0 };
      return {
        status: s,
        quantidade: d.quantidade,
        valor: Math.round(d.valor * 100) / 100,
      };
    });
    // Incluir status que existem nos pedidos mas não estão na ordem (ex.: custom)
    porStatus.forEach((d, status) => {
      if (!ORDEM_STATUS_FUNIL.includes(status)) {
        funilStatus.push({
          status,
          quantidade: d.quantidade,
          valor: Math.round(d.valor * 100) / 100,
        });
      }
    });

    return NextResponse.json({
      mesReferencia,
      vendasMensais,
      top10Produtos,
      top5Familias,
      top3Categorias,
      top5Tecidos,
      funilStatus,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Erro ao buscar dados do dashboard de vendas";
    console.error("Erro ao buscar dados do dashboard de vendas:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
