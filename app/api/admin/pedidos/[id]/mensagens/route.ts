import { requireAdminSession } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound } from "@/lib/http";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const body = await req.json().catch(() => ({}));
    const texto = typeof body?.texto === "string" ? body.texto.trim() : "";

    if (!texto) return unprocessable({ message: "Mensagem vazia" });

    const ped = await prisma.pedido.findUnique({ where: { id: params.id } });
    if (!ped) return notFound();

    const user = await prisma.user.findUnique({ where: { email: session.user?.email ?? "" } });
    if (!user) return new Response(JSON.stringify({ ok: false, error: "Usuário não encontrado" }), { status: 401, headers: { "Content-Type": "application/json" } });

    const msg = await prisma.mensagemPedido.create({
      data: { pedidoId: ped.id, userId: user.id, role: user.role, texto },
    });

    return ok(msg);
  } catch (e: any) {
    console.error("Erro ao criar mensagem:", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message || "Erro ao enviar mensagem" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

