import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "ADMIN" | "OPERADOR" | "FABRICA" | "CLIENTE";
  }

  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: "ADMIN" | "OPERADOR" | "FABRICA" | "CLIENTE";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "OPERADOR" | "FABRICA" | "CLIENTE";
  }
}




