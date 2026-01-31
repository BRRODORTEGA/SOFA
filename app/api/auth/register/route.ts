import { prisma } from "@/lib/prisma";
import { ok, unprocessable, serverError } from "@/lib/http";
import { z } from "zod";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
  cpfCnpj: z.string().min(11, "CPF/CNPJ inválido"),
  name: z.string().min(2, "Nome muito curto"),
  sobrenome: z.string().min(2, "Sobrenome muito curto"),
  dataNascimento: z.string().optional(),
  genero: z.string().optional(),
  celular: z.string().min(10, "Celular é obrigatório (mínimo 10 dígitos)"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  aceiteTermos: z.literal(true, { errorMap: () => ({ message: "Aceite os termos e condições" }) }),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      console.error("Erro de validação:", parsed.error.flatten());
      return unprocessable(parsed.error.flatten());
    }

    const { cpfCnpj, name, sobrenome, dataNascimento, genero, celular, email, password } = parsed.data;

    // Normalizar email para lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar se o e-mail já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      console.error("E-mail já cadastrado:", normalizedEmail);
      return unprocessable({ message: "Usuário já cadastrado com este e-mail." });
    }

    // Parse data de nascimento (DD/MM/AAAA -> Date)
    let dataNascimentoDate: Date | null = null;
    if (dataNascimento && dataNascimento.replace(/\D/g, "").length === 8) {
      const [d, m, a] = dataNascimento.split("/");
      if (d && m && a) dataNascimentoDate = new Date(Number(a), Number(m) - 1, Number(d));
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário com role CLIENTE (sem verificação de email por enquanto)
    const user = await prisma.user.create({
      data: {
        cpfCnpj: cpfCnpj.replace(/\D/g, "").trim() || null,
        name: name.trim(),
        sobrenome: sobrenome.trim(),
        dataNascimento: dataNascimentoDate,
        genero: genero?.trim() || null,
        celular: celular.replace(/\D/g, "").trim(),
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
      return unprocessable({ message: "Usuário já cadastrado com este e-mail." });
    }
    return serverError(e.message || "Erro ao criar conta");
  }
}

