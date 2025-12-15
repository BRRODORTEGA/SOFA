import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound, serverError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return unprocessable({ message: "Token de verificação não fornecido" });
    }

    // Buscar usuário pelo token
    const user = await prisma.user.findUnique({
      where: { tokenVerificacao: token },
    });

    if (!user) {
      return notFound({ message: "Token de verificação inválido" });
    }

    // Verificar se o token expirou
    if (user.tokenExpiracao && user.tokenExpiracao < new Date()) {
      return unprocessable({ message: "Token de verificação expirado. Solicite um novo link de verificação." });
    }

    // Verificar se o email já foi verificado
    if (user.emailVerificado) {
      return ok({ message: "E-mail já foi verificado anteriormente" });
    }

    // Ativar conta do usuário
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificado: true,
        tokenVerificacao: null,
        tokenExpiracao: null,
      },
    });

    return ok({ message: "E-mail verificado com sucesso! Sua conta está ativa." });
  } catch (e: any) {
    console.error("Erro ao verificar email:", e);
    return serverError();
  }
}



