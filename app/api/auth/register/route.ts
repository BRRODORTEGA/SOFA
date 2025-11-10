import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";
import { z } from "zod";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
    }

    const { name, email, password } = parsed.data;

    // Verificar se o e-mail já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return unprocessable({ message: "E-mail já cadastrado" });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário com role CLIENTE
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENTE",
      },
    });

    return ok({ id: user.id, email: user.email, name: user.name });
  } catch (e: any) {
    console.error("Register error:", e);
    return serverError();
  }
}

