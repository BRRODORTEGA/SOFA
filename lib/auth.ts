import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { ENV } from "./env";
import { prisma } from "./prisma";
import bcryptjs from "bcryptjs";

export const authOptions: NextAuthOptions = {
  secret: ENV.NEXTAUTH_SECRET || "changeme",
  providers: [
    Credentials({
      name: "Email e Senha",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        // Tentar buscar usuário no banco
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (user) {
            // Verificar senha com bcrypt
            const isValid = await bcryptjs.compare(credentials.password, user.password);
            if (isValid) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              };
            }
          }
        } catch (error) {
          console.error("Auth error:", error);
        }

        // Fallback para usuários mock (para desenvolvimento)
        const map: Record<string, { pass: string; role: "ADMIN" | "OPERADOR" | "FABRICA" | "CLIENTE" }> = {
          "admin@gmail.com": { pass: "admin", role: "ADMIN" },
          "op@local": { pass: "op", role: "OPERADOR" },
          "fab@local": { pass: "fab", role: "FABRICA" },
          "cli@local": { pass: "cli", role: "CLIENTE" },
        };

        const found = map[credentials.email.toLowerCase()];
        if (found && found.pass === credentials.password) {
          return {
            id: credentials.email,
            name: credentials.email.split("@")[0],
            email: credentials.email,
            role: found.role,
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      // injeta role no token
      if (user && (user as any).role) {
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // expõe role na session
      if (session.user) {
        (session.user as any).role = token.role ?? "CLIENTE";
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

export function auth() {
  return getServerSession(authOptions);
}

