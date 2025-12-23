import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  const pedidos = await prisma.pedido.findMany({
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
        select: {
          id: true,
          role: true,
          createdAt: true,
        },
      },
      historico: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
        take: 1, // Último status
      },
    },
  });

  // Enriquecer pedidos com informações de atualizações
  const pedidosComAtualizacoes = pedidos.map((pedido) => {
    const ultimaMensagem = pedido.mensagens[0];
    const ultimoStatus = pedido.historico[0];
    
    // Verificar se há nova mensagem do admin/operador
    // Nova mensagem = última mensagem é do admin/operador E é mais recente que a última mensagem do cliente
    const mensagensCliente = pedido.mensagens.filter(m => m.role === "CLIENTE");
    const ultimaMensagemCliente = mensagensCliente[0];
    
    const temNovaMensagemAdmin = ultimaMensagem && 
      (ultimaMensagem.role === "ADMIN" || ultimaMensagem.role === "OPERADOR") &&
      (!ultimaMensagemCliente || new Date(ultimaMensagem.createdAt) > new Date(ultimaMensagemCliente.createdAt));
    
    // Verificar se houve atualização de status
    // Considera atualização se o status atual não é "Solicitado" (status inicial)
    // E o último status foi alterado após a última mensagem do cliente (ou criação do pedido se não houver mensagens)
    const dataReferencia = ultimaMensagemCliente 
      ? new Date(ultimaMensagemCliente.createdAt)
      : new Date(pedido.createdAt);
    
    const temAtualizacaoStatus = ultimoStatus && 
      ultimoStatus.status !== "Solicitado" &&
      ultimoStatus.status !== "Aguardando Pagamento" && // Status intermediário não conta como atualização
      new Date(ultimoStatus.createdAt) > dataReferencia;

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

