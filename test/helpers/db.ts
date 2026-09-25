import { Category, TransactionType } from '@prisma/client';
import { sql } from 'kysely';
import { KyselyService } from '@/modules/kysely/kysely.service';

export async function resetDb(db: KyselyService): Promise<void> {
  await sql`TRUNCATE "Transaction", "Wallet" CASCADE`.execute(db);
}

export interface TestCategories {
  food: Category;
  transport: Category;
  housing: Category;
  salary: Category;
  transferExpense: Category;
  transferIncome: Category;
}

export async function loadCategories(
  db: KyselyService,
): Promise<TestCategories> {
  const categories = await db.selectFrom('Category').selectAll().execute();

  const find = (name: string, type: TransactionType) => {
    const category = categories.find(
      (item) => item.name === name && item.type === type,
    );

    if (!category) {
      throw new Error(`Seed category ${name} (${type}) not found`);
    }

    return category;
  };

  return {
    food: find('Food', TransactionType.EXPENSE),
    transport: find('Transport', TransactionType.EXPENSE),
    housing: find('Housing', TransactionType.EXPENSE),
    salary: find('Salary', TransactionType.INCOME),
    transferExpense: find('Transfer', TransactionType.EXPENSE),
    transferIncome: find('Transfer', TransactionType.INCOME),
  };
}

export async function getWalletBalance(
  db: KyselyService,
  walletId: string,
): Promise<number> {
  const wallet = await db
    .selectFrom('Wallet')
    .select('balanceInCents')
    .where('id', '=', walletId)
    .executeTakeFirstOrThrow();

  return wallet.balanceInCents;
}

export async function countTransactions(db: KyselyService): Promise<number> {
  const { count } = await db
    .selectFrom('Transaction')
    .select((eb) => eb.fn.countAll<string>().as('count'))
    .executeTakeFirstOrThrow();

  return Number(count);
}
