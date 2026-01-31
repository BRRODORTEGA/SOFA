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

    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return unprocessable({
        message: "Apenas arquivos PDF são permitidos.",
      });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return unprocessable({
        message: "Arquivo muito grande. Tamanho máximo: 10MB.",
      });
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== "EEXIST") throw error;
    }

    const ext = file.name.toLowerCase().endsWith(".pdf") ? "pdf" : "pdf";
    const fileName = `${randomUUID()}.${ext}`;
    const filePath = join(uploadsDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const url = `/uploads/${fileName}`;
    return ok({ url, fileName });
  } catch (error: any) {
    console.error("Erro ao fazer upload do PDF:", error);
    return serverError(error?.message || "Erro ao fazer upload do PDF");
  }
}
