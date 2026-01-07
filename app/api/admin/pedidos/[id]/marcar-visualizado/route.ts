import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http";
import { revalidatePath } from "next/cache";

// Função para garantir que a coluna ultimaVisualizacaoAdmin existe
async function ensureUltimaVisualizacaoAdminColumnExists() {
  try {
    const result = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'Pedido' 
       AND column_name = 'ultimaVisualizacaoAdmin'`
    );
    
    if (result.length === 0) {
      await prisma.$executeRawUnsafe(
        `DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'Pedido' 
            AND column_name = 'ultimaVisualizacaoAdmin'
          ) THEN
            ALTER TABLE "Pedido" ADD COLUMN "ultimaVisualizacaoAdmin" TIMESTAMP(3);
          END IF;
        END $$;`
      );
      console.log("Coluna ultimaVisualizacaoAdmin criada com sucesso");
    }
  } catch (e: any) {
    console.log("Erro ao verificar/criar coluna ultimaVisualizacaoAdmin:", e?.message);
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  // Garantir que a coluna existe antes de usar
  await ensureUltimaVisualizacaoAdminColumnExists();
  
  const session = await auth();
  if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return new Response("Unauthorized", { status: 401 });

  // Verificar se o usuário é admin ou operador
  if (user.role !== "ADMIN" && user.role !== "OPERADOR") {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    // Marcar o pedido como visualizado pelo admin
    await prisma.pedido.update({
      where: {
        id: params.id,
      },
      data: {
        ultimaVisualizacaoAdmin: new Date(),
      },
    });

    // Revalidar a página de listagem de pedidos para atualizar as sinalizações
    revalidatePath("/admin/pedidos");

    return ok({ success: true });
  } catch (error) {
    console.error("Erro ao marcar pedido como visualizado pelo admin:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

