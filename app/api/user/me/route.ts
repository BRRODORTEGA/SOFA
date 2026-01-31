import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateUserSchema = z.object({
  cpfCnpj: z.string().optional(),
  name: z.string().min(2, "Nome muito curto"),
  sobrenome: z.string().optional(),
  dataNascimento: z.string().optional(),
  genero: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
});

export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        sobrenome: true,
        cpfCnpj: true,
        dataNascimento: true,
        genero: true,
        celular: true,
        email: true,
        role: true,
        emailVerificado: true,
        representante: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do usuário" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cpfCnpj, name, sobrenome, dataNascimento, genero, celular, email, password } = parsed.data;

    // Buscar usuário atual
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();

    // Verificar se o novo email já está em uso por outro usuário
    if (normalizedEmail !== currentUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Este e-mail já está em uso por outra conta" },
          { status: 400 }
        );
      }
    }

    // Parse data de nascimento (DD/MM/AAAA -> Date)
    let dataNascimentoDate: Date | null | undefined = undefined;
    if (dataNascimento !== undefined) {
      if (dataNascimento === "" || dataNascimento.replace(/\D/g, "").length < 8) {
        dataNascimentoDate = null;
      } else {
        const [d, m, a] = dataNascimento.split("/");
        if (d && m && a) dataNascimentoDate = new Date(Number(a), Number(m) - 1, Number(d));
        else dataNascimentoDate = null;
      }
    }

    // Preparar dados para atualização
    const updateData: any = {
      name: name.trim(),
      email: normalizedEmail,
      ...(cpfCnpj !== undefined && { cpfCnpj: cpfCnpj.replace(/\D/g, "").trim() || null }),
      ...(sobrenome !== undefined && { sobrenome: sobrenome?.trim() || null }),
      ...(dataNascimentoDate !== undefined && { dataNascimento: dataNascimentoDate }),
      ...(genero !== undefined && { genero: genero?.trim() || null }),
      ...(celular !== undefined && { celular: celular?.replace(/\D/g, "").trim() || null }),
    };

    // Se senha foi fornecida, fazer hash
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        sobrenome: true,
        cpfCnpj: true,
        dataNascimento: true,
        genero: true,
        celular: true,
        email: true,
        role: true,
        emailVerificado: true,
        representante: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Dados atualizados com sucesso",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Erro ao atualizar dados do usuário:", error);
    
    // Tratar erro de constraint única (email duplicado)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Este e-mail já está em uso por outra conta" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar dados do usuário", details: error.message },
      { status: 500 }
    );
  }
}

