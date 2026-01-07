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

export async function POST(req: Request) {
  // Garantir que a coluna existe antes de usar
  await ensureUltimaVisualizacaoColumnExists();
  
  const session = await auth();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    const { pedidoId } = await req.json();

    if (pedidoId) {
      // Marcar um pedido específico como visualizado
      await prisma.pedido.update({
        where: {
          id: pedidoId,
          clienteId: user.id, // Garantir que o pedido pertence ao usuário
        },
        data: {
          ultimaVisualizacaoCliente: new Date(),
        },
      });
    } else {
      // Marcar todos os pedidos do usuário como visualizados
      await prisma.pedido.updateMany({
        where: {
          clienteId: user.id,
        },
        data: {
          ultimaVisualizacaoCliente: new Date(),
        },
      });
    }

    return ok({ success: true });
  } catch (error) {
    console.error("Erro ao marcar pedidos como visualizados:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

