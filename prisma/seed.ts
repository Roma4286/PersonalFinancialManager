import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Housing', type: 'expense' },
    { name: 'Food', type: 'expense' },
    { name: 'Transport', type: 'expense' },
    { name: 'salary', type: 'income' },
  ];

  for (const category of categories) {
    await prisma.categories.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
