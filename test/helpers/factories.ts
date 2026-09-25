import { INestApplication } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Wallet } from '@prisma/client';
import request from 'supertest';
import { KyselyService } from '@/modules/kysely/kysely.service';

export interface TransactionBody {
  id: string;
  amountInCents: number;
  description: string | null;
  date: string;
  walletId: string;
  categoryId: string;
  transferGroupId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransferBody {
  transferGroupId: string;
  transactions: TransactionBody[];
}

export async function createWallet(
  db: KyselyService,
  overrides: { name?: string; balanceInCents?: number } = {},
): Promise<Wallet> {
  return await db
    .insertInto('Wallet')
    .values({
      id: createId(),
      name: overrides.name ?? `Wallet ${createId()}`,
      balanceInCents: overrides.balanceInCents ?? 0,
      updatedAt: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function createTransaction(
  app: INestApplication,
  body: {
    walletId: string;
    categoryId: string;
    amountInCents: number;
    description?: string;
    date?: string;
  },
): Promise<TransactionBody> {
  const res = await request(app.getHttpServer())
    .post('/transactions')
    .send(body)
    .expect(201);

  return res.body as TransactionBody;
}

export async function createTransfer(
  app: INestApplication,
  body: {
    fromWalletId: string;
    toWalletId: string;
    amountInCents: number;
    description?: string;
    date?: string;
  },
): Promise<TransferBody> {
  const res = await request(app.getHttpServer())
    .post('/transfers')
    .send(body)
    .expect(201);

  return res.body as TransferBody;
}
