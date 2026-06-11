import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const wallets = await tx.wallet.findMany({
      select: { id: true, balance: true },
    });

    for (const wallet of wallets) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceInCents: Number(wallet.balance.mul(100).toFixed(0)),
        },
      });
    }

    const transactions = await tx.transaction.findMany({
      select: {
        id: true,
        amount: true,
        category: { select: { type: true } },
      },
    });

    for (const t of transactions) {
      const sign = t.category.type === TransactionType.EXPENSE ? -1 : 1;

      const amountInCents = Number(t.amount.mul(100).toFixed(0)) * sign;

      await tx.transaction.update({
        where: { id: t.id },
        data: { amountInCents },
      });
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
