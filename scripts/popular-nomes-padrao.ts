import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const nomesPadrao = [
  "Sofá 2 Lugares",
  "Sofá 3 Lugares",
  "Sofá Cama",
  "Banco",
  "Canto",
  "Canto c/ 2Reclíneos",
  "Canto p/ Módulo Fixo",
  "Canto  p/ Módulo Retrátil",
  "Chaise c/ braco",
  "Chaise s/ braco",
  "Chaise Giratória",
  "Chaise Recamier Fixo",
  "Chaise Recamier Fixo- s/chuleio",
  "Modulo c/ Braço",
  "Modulo s/ Braço",
  "Módulo 130 S/ Br com Bandeja",
  "Poltrona",
  "Puff",
  "Puff Ângulo",
  "Puff Canto",
  "Puff Central",
  "Puff Giratório",
  "Recamier",
];

async function main() {
  console.log("Populando nomes padrão de produtos...");

  for (let i = 0; i < nomesPadrao.length; i++) {
    const nome = nomesPadrao[i];
    try {
      await prisma.nomePadraoProduto.upsert({
        where: { nome },
        update: {
          ativo: true,
          ordem: i + 1,
        },
        create: {
          nome,
          ativo: true,
          ordem: i + 1,
        },
      });
      console.log(`✓ ${nome}`);
    } catch (error) {
      console.error(`✗ Erro ao criar ${nome}:`, error);
    }
  }

  console.log("\nConcluído!");
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


