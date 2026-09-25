import { INestApplication } from '@nestjs/common';
import { createId, isCuid } from '@paralleldrive/cuid2';
import { Wallet } from '@prisma/client';
import request from 'supertest';
import { KyselyService } from '@/modules/kysely/kysely.service';
import { createTestApp } from '../helpers/create-app';
import {
  countTransactions,
  getWalletBalance,
  loadCategories,
  loadWallets,
  resetDb,
  setWalletBalance,
  TestCategories,
} from '../helpers/db';
import {
  createTransaction,
  createTransfer,
  TransactionBody,
  TransferBody,
} from '../helpers/factories';
import {
  TRANSACTION_RESPONSE_KEYS,
  TRANSFER_RESPONSE_KEYS,
} from '../helpers/response-keys';

const expenseLeg = (transfer: TransferBody) =>
  transfer.transactions.find((t) => t.amountInCents < 0)!;
const incomeLeg = (transfer: TransferBody) =>
  transfer.transactions.find((t) => t.amountInCents > 0)!;

describe('Transfers (e2e)', () => {
  let app: INestApplication;
  let db: KyselyService;
  let categories: TestCategories;
  let from: Wallet;
  let to: Wallet;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(KyselyService);
    categories = await loadCategories(db);
    ({ wallet: from, card: to } = await loadWallets(db));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(db);
    await setWalletBalance(db, from.id, 10000);
    await setWalletBalance(db, to.id, 1000);
  });

  describe('POST /transfers', () => {
    it('creates two legs and moves money between wallets', async () => {
      const res = await api()
        .post('/transfers')
        .send({
          fromWalletId: from.id,
          toWalletId: to.id,
          amountInCents: 2500,
        })
        .expect(201);

      const transfer = res.body as TransferBody;
      expect(Object.keys(transfer).sort()).toEqual(TRANSFER_RESPONSE_KEYS);
      for (const leg of transfer.transactions) {
        expect(Object.keys(leg).sort()).toEqual(TRANSACTION_RESPONSE_KEYS);
      }
      expect(isCuid(transfer.transferGroupId)).toBe(true);
      expect(transfer.transactions).toHaveLength(2);
      expect(expenseLeg(transfer)).toMatchObject({
        walletId: from.id,
        amountInCents: -2500,
        categoryId: categories.transferExpense.id,
        transferGroupId: transfer.transferGroupId,
      });
      expect(incomeLeg(transfer)).toMatchObject({
        walletId: to.id,
        amountInCents: 2500,
        categoryId: categories.transferIncome.id,
        transferGroupId: transfer.transferGroupId,
      });

      expect(await getWalletBalance(db, from.id)).toBe(7500);
      expect(await getWalletBalance(db, to.id)).toBe(3500);
    });

    it('allows the source balance to become negative', async () => {
      await api()
        .post('/transfers')
        .send({
          fromWalletId: from.id,
          toWalletId: to.id,
          amountInCents: 15000,
        })
        .expect(201);

      expect(await getWalletBalance(db, from.id)).toBe(-5000);
      expect(await getWalletBalance(db, to.id)).toBe(16000);
    });

    it('applies description and date to both legs', async () => {
      const transfer = await createTransfer(app, {
        fromWalletId: from.id,
        toWalletId: to.id,
        amountInCents: 100,
        description: 'Savings',
        date: '2026-03-01T09:00:00.000Z',
      });

      for (const leg of transfer.transactions) {
        expect(leg).toMatchObject({
          description: 'Savings',
          date: '2026-03-01T09:00:00.000Z',
        });
      }
    });

    it('returns 400 when wallets are the same', async () => {
      await api()
        .post('/transfers')
        .send({
          fromWalletId: from.id,
          toWalletId: from.id,
          amountInCents: 100,
        })
        .expect(400);

      expect(await countTransactions(db)).toBe(0);
    });

    it('returns 404 for an unknown source wallet and changes nothing', async () => {
      await api()
        .post('/transfers')
        .send({
          fromWalletId: createId(),
          toWalletId: to.id,
          amountInCents: 100,
        })
        .expect(404);

      expect(await getWalletBalance(db, to.id)).toBe(1000);
      expect(await countTransactions(db)).toBe(0);
    });

    it('returns 404 for an unknown target wallet and changes nothing', async () => {
      await api()
        .post('/transfers')
        .send({
          fromWalletId: from.id,
          toWalletId: createId(),
          amountInCents: 100,
        })
        .expect(404);

      expect(await getWalletBalance(db, from.id)).toBe(10000);
      expect(await countTransactions(db)).toBe(0);
    });

    it.each([0, -1, 1.5, 2147483648, '100', null])(
      'returns 400 for amountInCents = %p',
      async (amountInCents) => {
        await api()
          .post('/transfers')
          .send({ fromWalletId: from.id, toWalletId: to.id, amountInCents })
          .expect(400);
      },
    );

    it.each([
      ['fromWalletId that is not a cuid', { fromWalletId: 'not-a-cuid' }],
      ['toWalletId that is not a cuid', { toWalletId: 'not-a-cuid' }],
      ['invalid date', { date: '2026-02-30' }],
      [
        'description longer than 500 characters',
        { description: 'a'.repeat(501) },
      ],
      ['unknown field', { extra: true }],
    ])('returns 400 for %s', async (_, override) => {
      await api()
        .post('/transfers')
        .send({
          fromWalletId: from.id,
          toWalletId: to.id,
          amountInCents: 100,
          ...override,
        })
        .expect(400);
    });
  });

  describe('GET /transfers', () => {
    it('returns an empty array when there are no transfers', async () => {
      const res = await api().get('/transfers').expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns transfers with wallet names and a positive amount', async () => {
      const first = await createTransfer(app, {
        fromWalletId: from.id,
        toWalletId: to.id,
        amountInCents: 100,
      });
      const second = await createTransfer(app, {
        fromWalletId: to.id,
        toWalletId: from.id,
        amountInCents: 200,
      });

      const res = await api().get('/transfers').expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body).toEqual(
        expect.arrayContaining([
          {
            transferGroupId: first.transferGroupId,
            fromWalletId: from.id,
            fromWalletName: 'Wallet',
            toWalletId: to.id,
            toWalletName: 'Card',
            amountInCents: 100,
          },
          {
            transferGroupId: second.transferGroupId,
            fromWalletId: to.id,
            fromWalletName: 'Card',
            toWalletId: from.id,
            toWalletName: 'Wallet',
            amountInCents: 200,
          },
        ]),
      );
    });

    it('does not include regular transactions', async () => {
      await createTransaction(app, {
        walletId: from.id,
        categoryId: categories.food.id,
        amountInCents: 100,
      });

      const res = await api().get('/transfers').expect(200);

      expect(res.body).toEqual([]);
    });
  });

  describe('GET /transfers/:transferGroupId', () => {
    it('returns the transfer with both legs', async () => {
      const transfer = await createTransfer(app, {
        fromWalletId: from.id,
        toWalletId: to.id,
        amountInCents: 100,
      });

      const res = await api()
        .get(`/transfers/${transfer.transferGroupId}`)
        .expect(200);

      expect(res.body.transferGroupId).toBe(transfer.transferGroupId);
      expect(res.body.transactions).toHaveLength(2);
      expect(res.body.transactions).toEqual(
        expect.arrayContaining(transfer.transactions),
      );
    });

    it('returns 404 for a regular transaction id', async () => {
      const transaction = await createTransaction(app, {
        walletId: from.id,
        categoryId: categories.food.id,
        amountInCents: 100,
      });

      await api().get(`/transfers/${transaction.id}`).expect(404);
    });

    it('returns 400 for an invalid id', async () => {
      await api().get('/transfers/not-a-cuid').expect(400);
    });

    it('returns 404 for an unknown transfer', async () => {
      await api().get(`/transfers/${createId()}`).expect(404);
    });
  });

  describe('PATCH /transfers/:transferGroupId', () => {
    let transfer: TransferBody;

    beforeEach(async () => {
      transfer = await createTransfer(app, {
        fromWalletId: from.id,
        toWalletId: to.id,
        amountInCents: 1000,
        description: 'Initial',
        date: '2026-01-10T10:00:00.000Z',
      });
    });

    const legsOf = (body: TransferBody) => ({
      expense: expenseLeg(body),
      income: incomeLeg(body),
    });

    it('updates both legs and both balances when the amount changes', async () => {
      const res = await api()
        .patch(`/transfers/${transfer.transferGroupId}`)
        .send({ amountInCents: 3000 })
        .expect(200);

      const { expense, income } = legsOf(res.body as TransferBody);
      expect(expense.amountInCents).toBe(-3000);
      expect(income.amountInCents).toBe(3000);
      expect(await getWalletBalance(db, from.id)).toBe(7000);
      expect(await getWalletBalance(db, to.id)).toBe(4000);
    });

    it('keeps balances when the amount is the same', async () => {
      await api()
        .patch(`/transfers/${transfer.transferGroupId}`)
        .send({ amountInCents: 1000 })
        .expect(200);

      expect(await getWalletBalance(db, from.id)).toBe(9000);
      expect(await getWalletBalance(db, to.id)).toBe(2000);
    });

    it('updates description and date on both legs', async () => {
      const res = await api()
        .patch(`/transfers/${transfer.transferGroupId}`)
        .send({ description: 'Updated', date: '2026-02-01T00:00:00.000Z' })
        .expect(200);

      for (const leg of (res.body as TransferBody).transactions) {
        expect(leg).toMatchObject({
          description: 'Updated',
          date: '2026-02-01T00:00:00.000Z',
        });
      }
      expect(await getWalletBalance(db, from.id)).toBe(9000);
    });

    it('keeps everything for an empty body', async () => {
      const res = await api()
        .patch(`/transfers/${transfer.transferGroupId}`)
        .send({})
        .expect(200);

      const { expense, income } = legsOf(res.body as TransferBody);
      expect(expense).toMatchObject({
        amountInCents: -1000,
        description: 'Initial',
      });
      expect(income.amountInCents).toBe(1000);
      expect(await getWalletBalance(db, from.id)).toBe(9000);
      expect(await getWalletBalance(db, to.id)).toBe(2000);
    });

    it.each([
      ['fromWalletId', () => ({ fromWalletId: to.id })],
      ['toWalletId', () => ({ toWalletId: from.id })],
    ])('returns 400 when %s is sent', async (_, getBody) => {
      await api()
        .patch(`/transfers/${transfer.transferGroupId}`)
        .send(getBody())
        .expect(400);
    });

    it.each([0, -1, 1.5])(
      'returns 400 for amountInCents = %p',
      async (amountInCents) => {
        await api()
          .patch(`/transfers/${transfer.transferGroupId}`)
          .send({ amountInCents })
          .expect(400);
      },
    );

    it('returns 400 for an invalid id', async () => {
      await api().patch('/transfers/not-a-cuid').send({}).expect(400);
    });

    it('returns 404 for an unknown transfer', async () => {
      await api().patch(`/transfers/${createId()}`).send({}).expect(404);
    });
  });

  describe('DELETE /transfers/:transferGroupId', () => {
    it('deletes both legs and restores both balances', async () => {
      const transfer = await createTransfer(app, {
        fromWalletId: from.id,
        toWalletId: to.id,
        amountInCents: 2000,
      });

      const res = await api()
        .delete(`/transfers/${transfer.transferGroupId}`)
        .expect(204);

      expect(res.body).toEqual({});
      expect(await countTransactions(db)).toBe(0);
      expect(await getWalletBalance(db, from.id)).toBe(10000);
      expect(await getWalletBalance(db, to.id)).toBe(1000);
    });

    it('returns 404 when deleting twice', async () => {
      const transfer = await createTransfer(app, {
        fromWalletId: from.id,
        toWalletId: to.id,
        amountInCents: 2000,
      });

      await api().delete(`/transfers/${transfer.transferGroupId}`).expect(204);
      await api().delete(`/transfers/${transfer.transferGroupId}`).expect(404);
      expect(await getWalletBalance(db, from.id)).toBe(10000);
    });

    it('returns 404 for a regular transaction id', async () => {
      const transaction: TransactionBody = await createTransaction(app, {
        walletId: from.id,
        categoryId: categories.food.id,
        amountInCents: 100,
      });

      await api().delete(`/transfers/${transaction.id}`).expect(404);
      expect(await countTransactions(db)).toBe(1);
    });

    it('returns 400 for an invalid id', async () => {
      await api().delete('/transfers/not-a-cuid').expect(400);
    });
  });
});
