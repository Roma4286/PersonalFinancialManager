import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Housing', type: 'expense' },
    { name: 'Food', type: 'expense' },
    { name: 'Transport', type: 'expense' },
    { name: 'Salary', type: 'income' },
  ];

  for (const category of categories) {
    await prisma.categories.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {},
      create: category,
    });
  }

  const wallets = [{ name: 'Wallet' }, { name: 'Card' }];

  for (const wallet of wallets) {
    await prisma.wallets.upsert({
      where: {
        name: wallet.name,
      },
      update: {},
      create: wallet,
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
