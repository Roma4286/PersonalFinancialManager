import { INestApplication } from '@nestjs/common';
import request from 'supertest';

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
