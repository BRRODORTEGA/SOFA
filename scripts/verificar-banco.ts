import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verificando conexão com o banco de dados...\n");

  try {
    // Testar conexão básica
    await prisma.$connect();
    console.log("✅ Conexão estabelecida com sucesso!");

    // Verificar se o banco existe e está acessível
    const result = await prisma.$queryRaw`SELECT version() as version`;
    console.log("✅ PostgreSQL está respondendo");
    console.log(`   Versão: ${(result as any)[0]?.version || "N/A"}\n`);

    // Verificar tabelas existentes
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log(`📊 Tabelas encontradas: ${tables.length}`);
    if (tables.length > 0) {
      tables.forEach((t) => console.log(`   - ${t.tablename}`));
    } else {
      console.log("   ⚠️  Nenhuma tabela encontrada. Execute: npx prisma db push");
    }

    // Verificar contagem de usuários
    try {
      const userCount = await prisma.user.count();
      console.log(`\n👥 Total de usuários: ${userCount}`);
    } catch (e: any) {
      if (e.message?.includes("does not exist")) {
        console.log("\n⚠️  Tabela 'User' não existe. Execute: npx prisma db push");
      } else {
        throw e;
      }
    }

    console.log("\n✅ Verificação concluída com sucesso!");
  } catch (error: any) {
    console.error("\n❌ Erro ao conectar ao banco de dados:");
    console.error(`   ${error.message}\n`);

    if (error.message?.includes("connect ECONNREFUSED")) {
      console.log("💡 Possíveis soluções:");
      console.log("   1. Verifique se o PostgreSQL está rodando:");
      console.log("      Get-Service | Where-Object Name -like '*postgres*'");
      console.log("   2. Verifique a URL no arquivo .env:");
      console.log("      DATABASE_URL=postgresql://usuario:senha@localhost:5432/ai_sofa");
      console.log("   3. Verifique se o banco de dados existe:");
      console.log("      psql -U postgres -c 'SELECT datname FROM pg_database;'");
    } else if (error.message?.includes("does not exist")) {
      console.log("💡 O banco de dados não existe. Crie com:");
      console.log("   psql -U postgres -c 'CREATE DATABASE ai_sofa;'");
    } else if (error.message?.includes("password authentication failed")) {
      console.log("💡 Erro de autenticação. Verifique usuário e senha no .env");
    }

    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();


