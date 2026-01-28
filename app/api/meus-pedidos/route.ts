import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";

// Função para garantir que a coluna ultimaVisualizacaoCliente existe
async function ensureUltimaVisualizacaoColumnExists() {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'Pedido' 
       AND column_name = 'ultimaVisualizacaoCliente'`
    );
    
    if (result.length === 0) {
      await prisma.$executeRawUnsafe(
        `DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Pedido' 
            AND column_name = 'ultimaVisualizacaoCliente'
          ) THEN
            ALTER TABLE "Pedido" ADD COLUMN "ultimaVisualizacaoCliente" TIMESTAMP(3);
          END IF;
        END $$;`
      );
      console.log("Coluna ultimaVisualizacaoCliente criada com sucesso");
    }
  } catch (e: any) {
    console.log("Erro ao verificar/criar coluna ultimaVisualizacaoCliente:", e?.message);
  }
}

// Função para garantir que as colunas de edição/exclusão de mensagens existem
async function ensureMensagemColumnsExist() {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'MensagemPedido' 
       AND column_name IN ('editada', 'editadaEm', 'excluida', 'excluidaEm', 'updatedAt')`
    );
    
    const existingColumns = result.map(r => r.column_name);
    const neededColumns = ['editada', 'editadaEm', 'excluida', 'excluidaEm', 'updatedAt'];
    const missingColumns = neededColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      for (const col of missingColumns) {
        if (col === 'editada') {
          await prisma.$executeRawUnsafe(`ALTER TABLE "MensagemPedido" ADD COLUMN IF NOT EXISTS "editada" BOOLEAN NOT NULL DEFAULT false;`);
        } else if (col === 'editadaEm') {
          await prisma.$executeRawUnsafe(`ALTER TABLE "MensagemPedido" ADD COLUMN IF NOT EXISTS "editadaEm" TIMESTAMP(3);`);
        } else if (col === 'excluida') {
          await prisma.$executeRawUnsafe(`ALTER TABLE "MensagemPedido" ADD COLUMN IF NOT EXISTS "excluida" BOOLEAN NOT NULL DEFAULT false;`);
        } else if (col === 'excluidaEm') {
          await prisma.$executeRawUnsafe(`ALTER TABLE "MensagemPedido" ADD COLUMN IF NOT EXISTS "excluidaEm" TIMESTAMP(3);`);
        } else if (col === 'updatedAt') {
          await prisma.$executeRawUnsafe(`ALTER TABLE "MensagemPedido" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;`);
        }
      }
      console.log("Colunas de edição/exclusão de mensagens criadas com sucesso");
    }
  } catch (e: any) {
    console.log("Erro ao verificar/criar colunas de mensagem:", e?.message);
  }
}

export async function GET() {
  // Garantir que as colunas existem antes de usar
  await ensureUltimaVisualizacaoColumnExists();
  await ensureMensagemColumnsExist();
  
  const session = await auth();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Buscar pedidos sem filtrar mensagens excluídas primeiro (para evitar erro se a coluna não existir)
  const pedidosRaw = await prisma.pedido.findMany({
    where: { clienteId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      itens: {
        include: {
          produto: { select: { nome: true } },
          tecido: { select: { nome: true, grade: true } },
        },
      },
      mensagens: {
        orderBy: { createdAt: "desc" },
      },
      historico: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Filtrar mensagens excluídas manualmente e mapear os dados
  const pedidos = pedidosRaw.map((pedido: any) => ({
    id: pedido.id,
    codigo: pedido.codigo,
    status: pedido.status,
    createdAt: pedido.createdAt,
    updatedAt: pedido.updatedAt,
    ultimaVisualizacaoCliente: pedido.ultimaVisualizacaoCliente || null,
    itens: pedido.itens,
    mensagens: pedido.mensagens
      .filter((m: any) => !m.excluida) // Filtrar mensagens excluídas
      .map((m: any) => ({
        id: m.id,
        role: m.role,
        createdAt: m.createdAt,
        editada: m.editada || false,
        editadaEm: m.editadaEm || null,
      })),
    historico: pedido.historico.map((h: any) => ({
      id: h.id,
      status: h.status,
      createdAt: h.createdAt,
    })),
  }));

  // Enriquecer pedidos com informações de atualizações
  const pedidosComAtualizacoes = pedidos.map((pedido) => {
    const ultimaMensagem = pedido.mensagens[0];
    const ultimoStatus = pedido.historico[0];
    
    // Data de referência para verificar se há atualizações não visualizadas
    // Se o cliente já visualizou, usa a data da última visualização
    // Caso contrário, usa a data da última mensagem do cliente ou criação do pedido
    const mensagensCliente = pedido.mensagens.filter(m => m.role === "CLIENTE");
    const ultimaMensagemCliente = mensagensCliente[0];
    
    const dataReferenciaVisualizacao = pedido.ultimaVisualizacaoCliente 
      ? new Date(pedido.ultimaVisualizacaoCliente)
      : (ultimaMensagemCliente 
          ? new Date(ultimaMensagemCliente.createdAt)
          : new Date(pedido.createdAt));
    
    // Verificar se há nova mensagem do admin/operador não visualizada
    const temNovaMensagemAdmin = ultimaMensagem && 
      (ultimaMensagem.role === "ADMIN" || ultimaMensagem.role === "OPERADOR") &&
      new Date(ultimaMensagem.createdAt) > dataReferenciaVisualizacao;
    
    // Verificar se houve atualização de status não visualizada (qualquer mudança além de "Solicitado" inicial)
    const temAtualizacaoStatus = ultimoStatus &&
      ultimoStatus.status !== "Solicitado" &&
      new Date(ultimoStatus.createdAt) > dataReferenciaVisualizacao;

    const temAtualizacao = temNovaMensagemAdmin || temAtualizacaoStatus;

    return {
      ...pedido,
      temAtualizacao,
      temNovaMensagem: temNovaMensagemAdmin,
      temAtualizacaoStatus: temAtualizacaoStatus,
    };
  });

  return ok({ items: pedidosComAtualizacoes });
}

