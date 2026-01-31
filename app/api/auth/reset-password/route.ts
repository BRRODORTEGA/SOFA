import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";
import { z } from "zod";
import bcrypt from "bcryptjs";

const resetSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  newPassword: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirme a nova senha"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = resetSchema.safeParse(json);

    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
    }

    const { token, newPassword } = parsed.data;

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetRecord) {
      return unprocessable({ message: "Link inválido ou já utilizado. Solicite um novo link para redefinir a senha." });
    }

    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }).catch(() => {});
      return unprocessable({ message: "Este link expirou. Solicite um novo link para redefinir a senha." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({ where: { id: resetRecord.id } }),
    ]);

    return ok({
      message: "Senha alterada com sucesso. Faça login com sua nova senha.",
    });
  } catch (e: any) {
    console.error("Reset password error:", e);
    return serverError(e.message || "Erro ao redefinir senha");
  }
}
