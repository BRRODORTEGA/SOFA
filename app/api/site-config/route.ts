import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const siteConfig = await prisma.siteConfig.findUnique({
      where: { id: "site-config" },
      select: {
        logoUrl: true,
      },
    });

    return NextResponse.json({ logoUrl: siteConfig?.logoUrl || null });
  } catch (error) {
    console.error("Erro ao buscar configurações do site:", error);
    return NextResponse.json({ logoUrl: null });
  }
}

