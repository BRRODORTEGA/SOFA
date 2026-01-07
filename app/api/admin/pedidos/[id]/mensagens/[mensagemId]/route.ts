import { requireAdminSession } from "@/lib/auth-guard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound } from "@/lib/http";

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

// PUT - Editar uma mensagem
export async function PUT(
  req: Request,
  { params }: { params: { id: string; mensagemId: string } }
) {
  // Garantir que as colunas existem
  await ensureMensagemColumnsExist();
  
  const session = await requireAdminSession();
  const { texto } = await req.json();

  if (!texto?.trim()) return unprocessable({ message: "Mensagem vazia" });

  // Verificar se o pedido existe
  const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
  if (!pedido) return notFound();

  // Buscar a mensagem
  const mensagem = await prisma.mensagemPedido.findUnique({
    where: { id: params.mensagemId },
  });

  if (!mensagem) return notFound();

  // Verificar se a mensagem pertence ao pedido
  if (mensagem.pedidoId !== params.id) {
    return new Response("Mensagem não pertence a este pedido", { status: 400 });
  }

  // Verificar se a mensagem é do admin/operador (apenas essas podem ser editadas)
  if (mensagem.role !== "ADMIN" && mensagem.role !== "OPERADOR") {
    return new Response("Apenas mensagens do admin/operador podem ser editadas", { status: 403 });
  }

  // Atualizar a mensagem e marcar como editada
  const mensagemAtualizada = await prisma.mensagemPedido.update({
    where: { id: params.mensagemId },
    data: { 
      texto,
      editada: true,
      editadaEm: new Date(),
    },
  });

  return ok(mensagemAtualizada);
}

// DELETE - Excluir uma mensagem
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; mensagemId: string } }
) {
  // Garantir que as colunas existem
  await ensureMensagemColumnsExist();
  
  const session = await requireAdminSession();

  // Verificar se o pedido existe
  const pedido = await prisma.pedido.findUnique({ where: { id: params.id } });
  if (!pedido) return notFound();

  // Buscar a mensagem
  const mensagem = await prisma.mensagemPedido.findUnique({
    where: { id: params.mensagemId },
  });

  if (!mensagem) return notFound();

  // Verificar se a mensagem pertence ao pedido
  if (mensagem.pedidoId !== params.id) {
    return new Response("Mensagem não pertence a este pedido", { status: 400 });
  }

  // Verificar se a mensagem é do admin/operador (apenas essas podem ser excluídas)
  if (mensagem.role !== "ADMIN" && mensagem.role !== "OPERADOR") {
    return new Response("Apenas mensagens do admin/operador podem ser excluídas", { status: 403 });
  }

  // Soft delete - marcar como excluída em vez de deletar fisicamente
  await prisma.mensagemPedido.update({
    where: { id: params.mensagemId },
    data: {
      excluida: true,
      excluidaEm: new Date(),
    },
  });

  return ok({ success: true });
}

