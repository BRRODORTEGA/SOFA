import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, "Senha atual é obrigatória"),
  novaSenha: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmarNovaSenha: z.string().min(1, "Confirme a nova senha"),
});

// Mesmo mapa de usuários mock do lib/auth.ts (fallback de desenvolvimento)
const MOCK_USERS: Record<string, { pass: string; role: "ADMIN" | "OPERADOR" | "FABRICA" | "CLIENTE" }> = {
  "admin@gmail.com": { pass: "admin", role: "ADMIN" },
  "op@local": { pass: "op", role: "OPERADOR" },
  "fab@local": { pass: "fab", role: "FABRICA" },
  "cli@local": { pass: "cli", role: "CLIENTE" },
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "OPERADOR") {
      return NextResponse.json({ error: "Apenas administradores podem alterar a senha aqui" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = alterarSenhaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { senhaAtual, novaSenha, confirmarNovaSenha } = parsed.data;

    if (novaSenha !== confirmarNovaSenha) {
      return NextResponse.json({ error: "A nova senha e a confirmação não coincidem" }, { status: 400 });
    }

    const emailLower = session.user.email.toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      // Usuário mock (login de desenvolvimento): validar senha atual contra o mapa e criar usuário no banco
      const mock = MOCK_USERS[emailLower];
      if (!mock) {
        return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
      }
      if (mock.pass !== senhaAtual) {
        return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
      }
      const hashedNovaSenha = await bcrypt.hash(novaSenha, 10);
      await prisma.user.create({
        data: {
          email: emailLower,
          name: session.user.name ?? emailLower.split("@")[0],
          password: hashedNovaSenha,
          role: mock.role,
        },
      });
      return NextResponse.json({ message: "Senha definida com sucesso. Da próxima vez use a nova senha para entrar." });
    }

    const senhaAtualValida = await bcrypt.compare(senhaAtual, user.password);
    if (!senhaAtualValida) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    const hashedNovaSenha = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNovaSenha },
    });

    return NextResponse.json({ message: "Senha alterada com sucesso" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return NextResponse.json(
      { error: "Erro ao alterar senha" },
      { status: 500 }
    );
  }
}
