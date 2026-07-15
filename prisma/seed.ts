import { PrismaClient, TransactionType } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const transferExpenseCategoryId = process.env.TRANSFER_EXPENSE_CATEGORY_ID;
  const transferIncomeCategoryId = process.env.TRANSFER_INCOME_CATEGORY_ID;

  if (!transferExpenseCategoryId || !transferIncomeCategoryId) {
    throw new Error(
      'TRANSFER_EXPENSE_CATEGORY_ID and TRANSFER_INCOME_CATEGORY_ID must be set in .env',
    );
  }

  const categories = [
    { name: 'Housing', type: TransactionType.EXPENSE },
    { name: 'Food', type: TransactionType.EXPENSE },
    { name: 'Transport', type: TransactionType.EXPENSE },
    { name: 'Salary', type: TransactionType.INCOME },
    {
      id: transferExpenseCategoryId,
      name: 'Transfer',
      type: TransactionType.EXPENSE,
    },
    {
      id: transferIncomeCategoryId,
      name: 'Transfer',
      type: TransactionType.INCOME,
    },
  ];

  for (const category of categories) {
    const existing = await prisma.category.findUnique({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
    });

    if (!existing) {
      await prisma.category.create({ data: category });
    } else if (category.id && existing.id !== category.id) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { id: category.id },
      });
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
