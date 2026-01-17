import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Aplicando campo "lado" na tabela CarrinhoItem...');

  try {
    // Adicionar campo lado ao CarrinhoItem
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "CarrinhoItem" ADD COLUMN IF NOT EXISTS "lado" TEXT;
    `);
    console.log('✅ Campo "lado" adicionado com sucesso!');

    // Remover índice antigo se existir
    try {
      await prisma.$executeRawUnsafe(`
        DROP INDEX IF EXISTS "CarrinhoItem_produtoId_variacaoMedida_cm_tecidoId_idx";
      `);
      console.log('✅ Índice antigo removido (se existia)');
    } catch (e: any) {
      if (!e.message?.includes('does not exist')) {
        console.log('⚠️  Aviso ao remover índice antigo:', e.message);
      }
    }

    // Criar novo índice incluindo o campo lado
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CarrinhoItem_produtoId_variacaoMedida_cm_tecidoId_lado_idx" 
      ON "CarrinhoItem"("produtoId", "variacaoMedida_cm", "tecidoId", "lado");
    `);
    console.log('✅ Novo índice criado com sucesso!');

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao aplicar migração:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
