import { auth } from "./auth";
import { redirect } from "next/navigation";

export type AllowedRole = "ADMIN" | "OPERADOR";

export async function requireAdminSession(allowed: AllowedRole[] = ["ADMIN", "OPERADOR"]) {
  const session = await auth();
  if (!session || !session.user?.role) {
    redirect("/auth/login?reason=unauthenticated");
  }
  const role = session.user.role;
  if (!allowed.includes(role as AllowedRole)) {
    redirect("/auth/login?reason=forbidden");
  }
  return session;
}




