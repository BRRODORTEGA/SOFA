import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, notFound } from "@/lib/http";

// Função para garantir que as colunas de edição/exclusão existem
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

export async function GET(_: Request, { params }: { params: { id: string } }) {
  // Garantir que as colunas existem
  await ensureMensagemColumnsExist();
  
  const session = await auth();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const pedido = await prisma.pedido.findFirst({
    where: { id: params.id, clienteId: user.id },
    include: {
      itens: {
        include: {
          produto: { select: { id: true, nome: true, imagens: true } },
          tecido: { select: { id: true, nome: true, grade: true } },
        },
      },
      historico: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!pedido) return notFound();

  const mensagens = await prisma.mensagemPedido.findMany({
    where: { 
      pedidoId: pedido.id,
      excluida: false, // Não mostrar mensagens excluídas
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      texto: true,
      role: true,
      createdAt: true,
      editada: true,
      editadaEm: true,
      excluida: true,
      excluidaEm: true,
    },
  });

  return ok({ pedido, mensagens });
}

