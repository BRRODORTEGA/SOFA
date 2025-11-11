import { prisma } from "@/lib/prisma";
import { ok, unprocessable, notFound, serverError } from "@/lib/http";
import { tabelaPrecoSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** GET — obtém uma tabela de preços */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.tabelaPreco.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { linhas: true },
        },
      },
    });

    if (!item) return notFound();

    return ok({ item });
  } catch (e: any) {
    return serverError(e?.message || "Erro ao buscar tabela de preços");
  }
}

/** PUT — atualiza uma tabela de preços */
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const parsed = tabelaPrecoSchema.safeParse(json);
    
    if (!parsed.success) {
      return unprocessable(parsed.error.flatten());
    }

    const item = await prisma.tabelaPreco.update({
      where: { id: params.id },
      data: {
        nome: parsed.data.nome,
        ativo: parsed.data.ativo ?? true,
        descricao: parsed.data.descricao || null,
      },
    });

    return ok({ item });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro ao atualizar tabela de preços");
  }
}

/** DELETE — exclui uma tabela de preços */
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    // Verificar se há linhas vinculadas
    const tabela = await prisma.tabelaPreco.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { linhas: true },
        },
      },
    });

    if (!tabela) return notFound();

    if (tabela._count.linhas > 0) {
      return unprocessable({
        message: `Não é possível excluir esta tabela pois ela possui ${tabela._count.linhas} linha(s) de preço vinculada(s). Remova as linhas primeiro.`,
      });
    }

    await prisma.tabelaPreco.delete({
      where: { id: params.id },
    });

    return ok({ message: "Tabela de preços excluída com sucesso" });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e?.message || "Erro ao excluir tabela de preços");
  }
}


