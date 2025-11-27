import { prisma } from "@/lib/prisma";
import { ok, notFound, unprocessable, serverError } from "@/lib/http";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateClienteSchema = z.object({
  representante: z.boolean().optional(),
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação e permissão
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    
    if (!session || !["ADMIN", "OPERADOR"].includes(role)) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const cliente = await prisma.user.findUnique({
      where: { 
        id: params.id,
        role: "CLIENTE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerificado: true,
        representante: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            pedidos: true,
          },
        },
      },
    });

    if (!cliente) {
      return notFound();
    }

    return ok(cliente);
  } catch (error: any) {
    console.error("Erro ao buscar cliente:", error);
    return serverError(error?.message || "Erro ao buscar cliente");
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação e permissão
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    
    if (!session || !["ADMIN", "OPERADOR"].includes(role)) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = updateClienteSchema.safeParse(json);

    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
    }

    // Verificar se o cliente existe e é realmente um cliente
    const clienteExistente = await prisma.user.findUnique({
      where: { 
        id: params.id,
        role: "CLIENTE",
      },
    });

    if (!clienteExistente) {
      return notFound();
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return ok({
      id: updated.id,
      representante: updated.representante,
    });
  } catch (e: any) {
    console.error("Erro ao atualizar cliente:", e);
    
    if (e?.code === "P2025") return notFound();
    
    return serverError(e?.message || "Erro ao atualizar cliente");
  }
}

