import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ok, serverError } from "@/lib/http";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new Response("Unauthorized", { status: 401 });

    let carrinho = await prisma.carrinho.findUnique({
      where: { userId: user.id },
      include: {
        itens: {
          include: {
            produto: { select: { id: true, nome: true, imagens: true } },
            tecido: { select: { id: true, nome: true, grade: true } },
          },
        },
      },
    });

    if (!carrinho) {
      carrinho = await prisma.carrinho.create({
        data: { userId: user.id },
        include: {
          itens: {
            include: {
              produto: { select: { id: true, nome: true, imagens: true } },
              tecido: { select: { id: true, nome: true, grade: true } },
            },
          },
        },
      });
    }

    return ok(carrinho);
  } catch {
    return serverError();
  }
}

