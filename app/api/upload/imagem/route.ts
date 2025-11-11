import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { ok, unprocessable, serverError } from "@/lib/http";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return unprocessable({ message: "Nenhum arquivo enviado" });
    }

    // Validar tipo de arquivo
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return unprocessable({ 
        message: "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF." 
      });
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return unprocessable({ 
        message: "Arquivo muito grande. Tamanho máximo: 5MB." 
      });
    }

    // Criar diretório se não existir
    const uploadsDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error: any) {
      // Ignorar erro se o diretório já existir
      if (error.code !== "EEXIST") {
        throw error;
      }
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Converter File para Buffer e salvar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Retornar URL relativa para acessar a imagem
    const imageUrl = `/uploads/${fileName}`;

    return ok({ url: imageUrl, fileName });
  } catch (error: any) {
    console.error("Erro ao fazer upload da imagem:", error);
    return serverError(error?.message || "Erro ao fazer upload da imagem");
  }
}

