function requireEnv(key: string, optional = false) {
  const v = process.env[key];
  if (!v && !optional) {
    throw new Error(`Missing env var: ${key}`);
  }
  return v;
}

export const ENV = {
  DATABASE_URL: requireEnv("DATABASE_URL", true), // schema virá na Fase 2
  NEXTAUTH_SECRET: requireEnv("NEXTAUTH_SECRET", true),
  RESEND_API_KEY: requireEnv("RESEND_API_KEY", true),
  NEXT_PUBLIC_APP_URL: requireEnv("NEXT_PUBLIC_APP_URL", true) || "http://localhost:3000",
};




