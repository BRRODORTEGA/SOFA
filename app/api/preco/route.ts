import { getPrecoUnitario } from "@/lib/pricing";
import { ok, unprocessable, serverError } from "@/lib/http";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const produtoId = url.searchParams.get("produtoId");
    const tecidoId = url.searchParams.get("tecidoId");
    const medida = Number(url.searchParams.get("medida"));

    if (!produtoId || !tecidoId || !medida) {
      return unprocessable({ message: "Campos obrigatórios: produtoId, tecidoId, medida" });
    }

    const preco = await getPrecoUnitario(produtoId, medida, tecidoId);
    
    // Se não encontrou o preço, retorna null com flag indicando indisponibilidade
    if (preco === null) {
      return ok({ 
        preco: null, 
        disponivel: false,
        mensagem: "Me avise quando disponível"
      });
    }

    return ok({ 
      preco, 
      disponivel: true 
    });
  } catch (e: any) {
    if (e.message) {
      return unprocessable({ message: e.message });
    }
    return serverError();
  }
}

