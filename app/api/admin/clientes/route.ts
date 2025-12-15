import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError, paginateParams } from "@/lib/http";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // Verificar autenticação e permissão
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    
    if (!session || !["ADMIN", "OPERADOR"].includes(role)) {
      return Response.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { limit, offset, q } = paginateParams(new URL(req.url).searchParams);
    
    const where: any = {
      role: "CLIENTE", // Apenas clientes
    };
    
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerificado: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              pedidos: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);
    
    return ok({ items, total, limit, offset });
  } catch (error: any) {
    console.error("Erro ao listar clientes:", error);
    return serverError(error?.message || "Erro ao listar clientes");
  }
}


