import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Aplicando migração: adicionar campo possuiLados...');
  
  try {
    // Adicionar coluna se não existir
    await prisma.$executeRaw`
      ALTER TABLE "Produto" ADD COLUMN IF NOT EXISTS "possuiLados" BOOLEAN NOT NULL DEFAULT false;
    `;
    
    console.log('✓ Coluna possuiLados adicionada com sucesso');
    
    // Atualizar todos os produtos existentes para false
    await prisma.$executeRaw`
      UPDATE "Produto" SET "possuiLados" = false WHERE "possuiLados" IS NULL;
    `;
    
    console.log('✓ Produtos existentes atualizados para false');
    
    console.log('✅ Migração aplicada com sucesso!');
  } catch (error: any) {
    console.error('❌ Erro ao aplicar migração:', error.message);
    
    // Se a coluna já existe, apenas atualizar os valores NULL
    if (error.message?.includes('already exists') || error.code === '42701') {
      console.log('Coluna já existe, apenas atualizando valores NULL...');
      try {
        await prisma.$executeRaw`
          UPDATE "Produto" SET "possuiLados" = false WHERE "possuiLados" IS NULL;
        `;
        console.log('✅ Valores atualizados com sucesso!');
      } catch (updateError: any) {
        console.error('Erro ao atualizar valores:', updateError.message);
      }
    } else {
      throw error;
    }
  }
}

main()
  .catch((e) => {
    console.error('Erro fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

