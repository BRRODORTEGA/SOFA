import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";
import { z } from "zod";
import { randomBytes } from "crypto";
import { ENV } from "@/lib/env";
import { enviarEmailLog } from "@/lib/email-orders";
import { PasswordResetEmail } from "@/emails/password_reset";
import React from "react";

const forgotSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = forgotSchema.safeParse(json);

    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
    }

    const { email } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Sempre retornar sucesso para não revelar se o e-mail existe
    if (!user) {
      return ok({
        message:
          "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Verifique sua caixa de entrada e spam.",
      });
    }

    // Invalidar tokens anteriores deste usuário
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const baseUrl = (ENV.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    const subject = "Redefinir sua senha - AI Sofá";
    const react = React.createElement(PasswordResetEmail, {
      name: user.name ?? "Cliente",
      resetUrl,
    });

    try {
      await enviarEmailLog({
        to: user.email,
        subject,
        template: "password_reset",
        react,
      });
    } catch (emailErr: any) {
      console.error("[forgot-password] Erro ao enviar e-mail:", emailErr);
      // Não expor falha de envio ao cliente; ainda retornamos sucesso
    }

    return ok({
      message:
        "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Verifique sua caixa de entrada e spam.",
    });
  } catch (e: any) {
    console.error("Forgot password error:", e);
    return serverError(e.message || "Erro ao processar solicitação");
  }
}
