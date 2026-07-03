import { PrismaClient, TransactionType } from '@prisma/client';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function setEnvVar(key: string, value: string) {
  const envPath = path.join(__dirname, '..', '.env');
  const content = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf-8')
    : '';
  const lines = content.split('\n').filter((line) => line.length > 0);
  const idx = lines.findIndex((line) => line.startsWith(`${key}=`));
  const newLine = `${key}=${value}`;

  if (idx >= 0) {
    lines[idx] = newLine;
  } else {
    lines.push(newLine);
  }

  fs.writeFileSync(envPath, lines.join('\n') + '\n');
  process.env[key] = value;
}

async function main() {
  const categories = [
    { name: 'Housing', type: TransactionType.EXPENSE },
    { name: 'Food', type: TransactionType.EXPENSE },
    { name: 'Transport', type: TransactionType.EXPENSE },
    { name: 'Salary', type: TransactionType.INCOME },
    { name: 'Transfer', type: TransactionType.EXPENSE },
    { name: 'Transfer', type: TransactionType.INCOME },
  ];

  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: {
        name_type: {
          name: category.name,
          type: category.type,
        },
      },
      update: {},
      create: category,
    });

    if (
      category.name === 'Transfer' &&
      category.type === TransactionType.EXPENSE
    ) {
      setEnvVar('TRANSFER_EXPENSE_CATEGORY_ID', created.id);
    }

    if (
      category.name === 'Transfer' &&
      category.type === TransactionType.INCOME
    ) {
      setEnvVar('TRANSFER_INCOME_CATEGORY_ID', created.id);
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
