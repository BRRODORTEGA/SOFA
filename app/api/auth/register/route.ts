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
      console.error("Erro de validação:", parsed.error.flatten());
      return unprocessable(parsed.error.flatten());
    }

    const { name, email, password } = parsed.data;

    // Normalizar email para lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar se o e-mail já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      console.error("E-mail já cadastrado:", normalizedEmail);
      return unprocessable({ message: "E-mail já cadastrado" });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário com role CLIENTE (sem verificação de email por enquanto)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "CLIENTE",
      },
    });

    return ok({ 
      id: user.id, 
      email: user.email, 
      name: user.name,
      message: "Conta criada com sucesso!" 
    });
  } catch (e: any) {
    console.error("Register error:", e);
    // Se for erro do Prisma (ex: constraint violation), retornar mensagem mais específica
    if (e.code === 'P2002') {
      return unprocessable({ message: "E-mail já cadastrado" });
    }
    return serverError(e.message || "Erro ao criar conta");
  }
}

