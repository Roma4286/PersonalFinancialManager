import { PrismaClient, TransactionType } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: 'Housing', type: TransactionType.EXPENSE },
    { name: 'Food', type: TransactionType.EXPENSE },
    { name: 'Transport', type: TransactionType.EXPENSE },
    { name: 'Salary', type: TransactionType.INCOME },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findFirst({
      where: { name: category.name, type: category.type },
    });

    if (!existing) {
      await prisma.category.create({ data: category });
    }
  }

  const wallets = [{ name: 'Wallet' }, { name: 'Card' }];

  for (const wallet of wallets) {
    await prisma.wallet.upsert({
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
