import { prisma } from "@/lib/prisma";
import { ok, unprocessable } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return unprocessable({ message: "E-mail não fornecido" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        emailVerificado: true,
        role: true,
      },
    });

    if (!user) {
      return ok({ emailVerificado: null, exists: false });
    }

    return ok({ 
      emailVerificado: user.emailVerificado,
      exists: true,
      role: user.role,
    });
  } catch (e: any) {
    console.error("Erro ao verificar email:", e);
    return unprocessable({ message: "Erro ao verificar e-mail" });
  }
}



