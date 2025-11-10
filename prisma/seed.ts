import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Remover usuário antigo se existir
  try {
    await prisma.user.deleteMany({
      where: { email: "admin@local" },
    });
    console.log("🗑️  Usuário antigo (admin@local) removido");
  } catch (e) {
    // Ignorar se não existir
  }

  // Criar usuários de teste
  const hashedAdmin = await bcrypt.hash("admin", 10);
  const hashedOp = await bcrypt.hash("op", 10);
  const hashedFab = await bcrypt.hash("fab", 10);
  const hashedCli = await bcrypt.hash("cli", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      email: "admin@gmail.com",
      password: hashedAdmin,
      name: "Administrador",
      role: "ADMIN",
    },
    create: {
      email: "admin@gmail.com",
      password: hashedAdmin,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  const operador = await prisma.user.upsert({
    where: { email: "op@local" },
    update: {},
    create: {
      email: "op@local",
      password: hashedOp,
      name: "Operador",
      role: "OPERADOR",
    },
  });

  const fabrica = await prisma.user.upsert({
    where: { email: "fab@local" },
    update: {},
    create: {
      email: "fab@local",
      password: hashedFab,
      name: "Fábrica",
      role: "FABRICA",
    },
  });

  const cliente = await prisma.user.upsert({
    where: { email: "cli@local" },
    update: {},
    create: {
      email: "cli@local",
      password: hashedCli,
      name: "Cliente Teste",
      role: "CLIENTE",
    },
  });

  console.log("✅ Usuários criados:");
  console.log(`  - ${admin.email} (${admin.role})`);
  console.log(`  - ${operador.email} (${operador.role})`);
  console.log(`  - ${fabrica.email} (${fabrica.role})`);
  console.log(`  - ${cliente.email} (${cliente.role})`);

  console.log("\n✅ Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
