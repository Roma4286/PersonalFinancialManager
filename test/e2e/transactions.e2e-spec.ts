import { INestApplication } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { TransactionType, Wallet } from '@prisma/client';
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
} from '../helpers/factories';
import { TRANSACTION_RESPONSE_KEYS } from '../helpers/response-keys';

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let db: KyselyService;
  let categories: TestCategories;
  let wallet: Wallet;
  let card: Wallet;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    db = app.get(KyselyService);
    categories = await loadCategories(db);
    ({ wallet, card } = await loadWallets(db));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  describe('POST /transactions', () => {
    it('stores an expense as a negative amount and decreases the balance', async () => {
      await setWalletBalance(db, wallet.id, 10000);

      const res = await api()
        .post('/transactions')
        .send({
          walletId: wallet.id,
          categoryId: categories.food.id,
          amountInCents: 2500,
        })
        .expect(201);

      expect(res.body).toMatchObject({
        amountInCents: -2500,
        walletId: wallet.id,
        categoryId: categories.food.id,
        transferGroupId: null,
      });
      expect(await getWalletBalance(db, wallet.id)).toBe(7500);
    });

    it('stores an income as a positive amount and increases the balance', async () => {
      const res = await api()
        .post('/transactions')
        .send({
          walletId: wallet.id,
          categoryId: categories.salary.id,
          amountInCents: 10000,
        })
        .expect(201);

      expect(res.body.amountInCents).toBe(10000);
      expect(await getWalletBalance(db, wallet.id)).toBe(10000);
    });

    it('allows the balance to become negative', async () => {
      await api()
        .post('/transactions')
        .send({
          walletId: wallet.id,
          categoryId: categories.food.id,
          amountInCents: 3000,
        })
        .expect(201);

      expect(await getWalletBalance(db, wallet.id)).toBe(-3000);
    });

    it('returns only the response fields', async () => {
      const res = await api()
        .post('/transactions')
        .send({
          walletId: wallet.id,
          categoryId: categories.food.id,
          amountInCents: 100,
        })
        .expect(201);

      expect(Object.keys(res.body).sort()).toEqual(TRANSACTION_RESPONSE_KEYS);
    });

    it('defaults date to now and description to null', async () => {
      const before = Date.now();

      const transaction = await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.food.id,
        amountInCents: 100,
      });

      const date = new Date(transaction.date).getTime();
      expect(date).toBeGreaterThanOrEqual(before - 1000);
      expect(date).toBeLessThanOrEqual(Date.now() + 1000);
      expect(transaction.description).toBeNull();
    });

    it('stores the provided date and description', async () => {
      const transaction = await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.food.id,
        amountInCents: 100,
        date: '2026-03-15T12:30:00.000Z',
        description: 'Lunch',
      });

      expect(transaction.date).toBe('2026-03-15T12:30:00.000Z');
      expect(transaction.description).toBe('Lunch');
    });

    it.each([
      ['expense', () => categories.transferExpense.id],
      ['income', () => categories.transferIncome.id],
    ])(
      'returns 400 for the reserved transfer %s category',
      async (_, getCategoryId) => {
        await api()
          .post('/transactions')
          .send({
            walletId: wallet.id,
            categoryId: getCategoryId(),
            amountInCents: 100,
          })
          .expect(400);

        expect(await getWalletBalance(db, wallet.id)).toBe(0);
        expect(await countTransactions(db)).toBe(0);
      },
    );

    it('returns 404 for an unknown wallet', async () => {
      await api()
        .post('/transactions')
        .send({
          walletId: createId(),
          categoryId: categories.food.id,
          amountInCents: 100,
        })
        .expect(404);

      expect(await countTransactions(db)).toBe(0);
    });

    it('returns 404 for an unknown category and keeps the balance', async () => {
      await api()
        .post('/transactions')
        .send({
          walletId: wallet.id,
          categoryId: createId(),
          amountInCents: 100,
        })
        .expect(404);

      expect(await getWalletBalance(db, wallet.id)).toBe(0);
      expect(await countTransactions(db)).toBe(0);
    });

    it.each([0, -1, 1.5, 2147483648, '100', null])(
      'returns 400 for amountInCents = %p',
      async (amountInCents) => {
        await api()
          .post('/transactions')
          .send({
            walletId: wallet.id,
            categoryId: categories.food.id,
            amountInCents,
          })
          .expect(400);
      },
    );

    it.each([
      [
        'description longer than 500 characters',
        { description: 'a'.repeat(501) },
      ],
      ['walletId that is not a cuid', { walletId: 'not-a-cuid' }],
      ['categoryId that is not a cuid', { categoryId: 'not-a-cuid' }],
      ['invalid date', { date: '2026-02-30' }],
      ['non-date string', { date: 'yesterday' }],
      ['unknown field', { extra: true }],
    ])('returns 400 for %s', async (_, override) => {
      await api()
        .post('/transactions')
        .send({
          walletId: wallet.id,
          categoryId: categories.food.id,
          amountInCents: 100,
          ...override,
        })
        .expect(400);
    });
  });

  describe('GET /transactions', () => {
    it('returns an empty array when there are no transactions', async () => {
      const res = await api().get('/transactions').expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns only the response fields', async () => {
      await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.food.id,
        amountInCents: 100,
      });

      const res = await api().get('/transactions').expect(200);

      expect(Object.keys(res.body[0]).sort()).toEqual(
        TRANSACTION_RESPONSE_KEYS,
      );
    });

    it('sorts by date desc, then by id desc', async () => {
      const create = (date: string) =>
        createTransaction(app, {
          walletId: wallet.id,
          categoryId: categories.food.id,
          amountInCents: 100,
          date,
        });

      const oldest = await create('2026-01-01T00:00:00.000Z');
      const newest = await create('2026-01-03T00:00:00.000Z');
      const sameDayA = await create('2026-01-02T00:00:00.000Z');
      const sameDayB = await create('2026-01-02T00:00:00.000Z');
      const sameDay = [sameDayA.id, sameDayB.id].sort().reverse();

      const res = await api().get('/transactions').expect(200);

      expect(res.body.map((t: TransactionBody) => t.id)).toEqual([
        newest.id,
        ...sameDay,
        oldest.id,
      ]);
    });

    describe('filters', () => {
      let food: TransactionBody;
      let transport: TransactionBody;
      let salary: TransactionBody;
      let otherWallet: TransactionBody;

      beforeEach(async () => {
        food = await createTransaction(app, {
          walletId: wallet.id,
          categoryId: categories.food.id,
          amountInCents: 100,
          date: '2026-01-10T10:00:00.000Z',
        });
        transport = await createTransaction(app, {
          walletId: wallet.id,
          categoryId: categories.transport.id,
          amountInCents: 200,
          date: '2026-01-20T10:00:00.000Z',
        });
        salary = await createTransaction(app, {
          walletId: wallet.id,
          categoryId: categories.salary.id,
          amountInCents: 300,
          date: '2026-01-30T10:00:00.000Z',
        });
        otherWallet = await createTransaction(app, {
          walletId: card.id,
          categoryId: categories.food.id,
          amountInCents: 400,
          date: '2026-01-15T10:00:00.000Z',
        });
      });

      const getIds = async (query: Record<string, string>) => {
        const res = await api().get('/transactions').query(query).expect(200);
        return (res.body as TransactionBody[]).map((t) => t.id).sort();
      };

      it('filters by walletId', async () => {
        expect(await getIds({ walletId: wallet.id })).toEqual(
          [food.id, transport.id, salary.id].sort(),
        );
      });

      it('filters by categoryId', async () => {
        expect(await getIds({ categoryId: categories.food.id })).toEqual(
          [food.id, otherWallet.id].sort(),
        );
      });

      it('filters by type', async () => {
        expect(await getIds({ type: TransactionType.INCOME })).toEqual([
          salary.id,
        ]);
        expect(await getIds({ type: TransactionType.EXPENSE })).toEqual(
          [food.id, transport.id, otherWallet.id].sort(),
        );
      });

      it('filters by from', async () => {
        expect(await getIds({ from: '2026-01-15' })).toEqual(
          [transport.id, salary.id, otherWallet.id].sort(),
        );
      });

      it('filters by to', async () => {
        expect(await getIds({ to: '2026-01-15' })).toEqual(
          [food.id, otherWallet.id].sort(),
        );
      });

      it('combines filters', async () => {
        expect(
          await getIds({
            walletId: wallet.id,
            type: TransactionType.EXPENSE,
            from: '2026-01-15',
            to: '2026-01-25',
          }),
        ).toEqual([transport.id]);
      });
    });

    describe('date boundaries', () => {
      const createAt = async (walletId: string, date: string) =>
        createTransaction(app, {
          walletId,
          categoryId: categories.food.id,
          amountInCents: 100,
          date,
        });

      it('includes the whole `to` day and excludes next-day midnight', async () => {
        const endOfDay = await createAt(wallet.id, '2026-01-31T23:59:59.999Z');
        await createAt(wallet.id, '2026-02-01T00:00:00.000Z');

        const res = await api()
          .get('/transactions')
          .query({ to: '2026-01-31' })
          .expect(200);

        expect(res.body.map((t: TransactionBody) => t.id)).toEqual([
          endOfDay.id,
        ]);
      });

      it('includes `from` midnight and excludes the previous day', async () => {
        await createAt(wallet.id, '2026-01-31T23:59:59.999Z');
        const midnight = await createAt(wallet.id, '2026-02-01T00:00:00.000Z');

        const res = await api()
          .get('/transactions')
          .query({ from: '2026-02-01' })
          .expect(200);

        expect(res.body.map((t: TransactionBody) => t.id)).toEqual([
          midnight.id,
        ]);
      });

      it('accepts from equal to to', async () => {
        await api()
          .get('/transactions')
          .query({ from: '2026-01-01', to: '2026-01-01' })
          .expect(200);
      });
    });

    describe('pagination', () => {
      const insertTransactions = async (count: number) => {
        const start = Date.UTC(2026, 0, 1);

        await db
          .insertInto('Transaction')
          .values(
            Array.from({ length: count }, (_, i) => ({
              id: createId(),
              amountInCents: -100,
              walletId: wallet.id,
              categoryId: categories.food.id,
              date: new Date(start + i * 60000),
              updatedAt: new Date(),
            })),
          )
          .execute();
      };

      it('pages through results with page and pageSize', async () => {
        await insertTransactions(5);

        const page = async (n: number) =>
          (
            await api()
              .get('/transactions')
              .query({ page: n, pageSize: 2 })
              .expect(200)
          ).body as TransactionBody[];

        const [page1, page2, page3, page4] = await Promise.all([
          page(1),
          page(2),
          page(3),
          page(4),
        ]);

        expect([
          page1.length,
          page2.length,
          page3.length,
          page4.length,
        ]).toEqual([2, 2, 1, 0]);
        const ids = [...page1, ...page2, ...page3].map((t) => t.id);
        expect(new Set(ids).size).toBe(5);
      });

      it('returns 100 items by default and caps pageSize at 1000', async () => {
        await insertTransactions(1001);

        const byDefault = await api().get('/transactions').expect(200);
        const capped = await api()
          .get('/transactions')
          .query({ pageSize: 5000 })
          .expect(200);

        expect(byDefault.body).toHaveLength(100);
        expect(capped.body).toHaveLength(1000);
      });
    });

    it('includes transfer legs', async () => {
      const transfer = await createTransfer(app, {
        fromWalletId: wallet.id,
        toWalletId: card.id,
        amountInCents: 500,
      });

      const res = await api()
        .get('/transactions')
        .query({ walletId: wallet.id })
        .expect(200);

      expect(res.body).toEqual([
        expect.objectContaining({
          amountInCents: -500,
          transferGroupId: transfer.transferGroupId,
        }),
      ]);
    });

    it('returns 400 when from is after to', async () => {
      const res = await api()
        .get('/transactions')
        .query({ from: '2026-02-01', to: '2026-01-01' })
        .expect(400);

      expect(res.body.message).toContain('from must be <= to');
    });

    it.each([
      ['page = 0', { page: '0' }],
      ['pageSize = 0', { pageSize: '0' }],
      ['non-numeric page', { page: 'abc' }],
      ['fractional pageSize', { pageSize: '1.5' }],
      ['invalid month in from', { from: '2026-13-01' }],
      ['datetime in from', { from: '2026-01-01T00:00' }],
      ['wrong date format in to', { to: '01-01-2026' }],
      ['unknown type', { type: 'FOO' }],
      ['invalid walletId', { walletId: 'not-a-cuid' }],
      ['invalid categoryId', { categoryId: 'not-a-cuid' }],
      ['unknown query param', { foo: 'bar' }],
    ])('returns 400 for %s', async (_, query) => {
      await api().get('/transactions').query(query).expect(400);
    });
  });

  describe('GET /transactions/stats', () => {
    it('returns 400 without walletId', async () => {
      await api().get('/transactions/stats').expect(400);
    });

    it('returns 400 for an invalid walletId', async () => {
      await api()
        .get('/transactions/stats')
        .query({ walletId: 'not-a-cuid' })
        .expect(400);
    });

    it('returns 404 for an unknown wallet', async () => {
      await api()
        .get('/transactions/stats')
        .query({ walletId: createId() })
        .expect(404);
    });

    it('returns an empty array for a wallet without transactions', async () => {
      const res = await api()
        .get('/transactions/stats')
        .query({ walletId: wallet.id })
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns positive totals grouped by category', async () => {
      const create = (walletId: string, categoryId: string, amount: number) =>
        createTransaction(app, { walletId, categoryId, amountInCents: amount });

      await create(wallet.id, categories.food.id, 1000);
      await create(wallet.id, categories.food.id, 500);
      await create(wallet.id, categories.salary.id, 10000);
      await create(card.id, categories.food.id, 7000);

      const res = await api()
        .get('/transactions/stats')
        .query({ walletId: wallet.id })
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body).toEqual(
        expect.arrayContaining([
          {
            name: 'Food',
            type: TransactionType.EXPENSE,
            totalAmountInCents: 1500,
          },
          {
            name: 'Salary',
            type: TransactionType.INCOME,
            totalAmountInCents: 10000,
          },
        ]),
      );
    });

    it('excludes transfer legs', async () => {
      await createTransfer(app, {
        fromWalletId: wallet.id,
        toWalletId: card.id,
        amountInCents: 500,
      });

      const res = await api()
        .get('/transactions/stats')
        .query({ walletId: wallet.id })
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('filters by date range, including the whole `to` day', async () => {
      const create = (date: string, amount: number) =>
        createTransaction(app, {
          walletId: wallet.id,
          categoryId: categories.food.id,
          amountInCents: amount,
          date,
        });

      await create('2026-01-09T23:59:59.999Z', 1);
      await create('2026-01-10T00:00:00.000Z', 10);
      await create('2026-01-20T23:59:59.999Z', 100);
      await create('2026-01-21T00:00:00.000Z', 1000);

      const res = await api()
        .get('/transactions/stats')
        .query({ walletId: wallet.id, from: '2026-01-10', to: '2026-01-20' })
        .expect(200);

      expect(res.body).toEqual([
        {
          name: 'Food',
          type: TransactionType.EXPENSE,
          totalAmountInCents: 110,
        },
      ]);
    });

    it('returns 400 when from is after to', async () => {
      await api()
        .get('/transactions/stats')
        .query({ walletId: wallet.id, from: '2026-02-01', to: '2026-01-01' })
        .expect(400);
    });
  });

  describe('GET /transactions/:id', () => {
    it('returns the transaction with its category', async () => {
      const transaction = await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.food.id,
        amountInCents: 100,
      });

      const res = await api()
        .get(`/transactions/${transaction.id}`)
        .expect(200);

      expect(res.body).toEqual({
        ...transaction,
        category: {
          id: categories.food.id,
          name: 'Food',
          type: TransactionType.EXPENSE,
          createdAt: categories.food.createdAt.toISOString(),
          updatedAt: categories.food.updatedAt.toISOString(),
        },
      });
    });

    it('returns 400 for an invalid id', async () => {
      await api().get('/transactions/not-a-cuid').expect(400);
    });

    it('returns 404 for an unknown transaction', async () => {
      await api().get(`/transactions/${createId()}`).expect(404);
    });
  });

  describe('PATCH /transactions/:id', () => {
    let expense: TransactionBody;

    beforeEach(async () => {
      expense = await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.food.id,
        amountInCents: 1000,
        description: 'Groceries',
        date: '2026-01-10T10:00:00.000Z',
      });
    });

    it('updates the amount and shifts the balance by the difference', async () => {
      const res = await api()
        .patch(`/transactions/${expense.id}`)
        .send({ amountInCents: 3000 })
        .expect(200);

      expect(res.body.amountInCents).toBe(-3000);
      expect(Object.keys(res.body).sort()).toEqual(TRANSACTION_RESPONSE_KEYS);
      expect(await getWalletBalance(db, wallet.id)).toBe(-3000);
    });

    it('flips the sign when the category changes from expense to income', async () => {
      const res = await api()
        .patch(`/transactions/${expense.id}`)
        .send({ categoryId: categories.salary.id })
        .expect(200);

      expect(res.body).toMatchObject({
        amountInCents: 1000,
        categoryId: categories.salary.id,
      });
      expect(await getWalletBalance(db, wallet.id)).toBe(1000);
    });

    it('flips the sign when the category changes from income to expense', async () => {
      const income = await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.salary.id,
        amountInCents: 5000,
      });

      await api()
        .patch(`/transactions/${income.id}`)
        .send({ categoryId: categories.housing.id, amountInCents: 2000 })
        .expect(200);

      expect(await getWalletBalance(db, wallet.id)).toBe(-3000);
    });

    it('updates description and date without changing the balance', async () => {
      const res = await api()
        .patch(`/transactions/${expense.id}`)
        .send({ description: 'Dinner', date: '2026-02-01T18:00:00.000Z' })
        .expect(200);

      expect(res.body).toMatchObject({
        amountInCents: -1000,
        description: 'Dinner',
        date: '2026-02-01T18:00:00.000Z',
      });
      expect(await getWalletBalance(db, wallet.id)).toBe(-1000);
    });

    it('keeps all values for an empty body', async () => {
      const res = await api()
        .patch(`/transactions/${expense.id}`)
        .send({})
        .expect(200);

      expect(res.body).toMatchObject({
        amountInCents: -1000,
        description: 'Groceries',
        date: '2026-01-10T10:00:00.000Z',
        categoryId: categories.food.id,
      });
      expect(await getWalletBalance(db, wallet.id)).toBe(-1000);
    });

    it('returns 400 when walletId is sent', async () => {
      await api()
        .patch(`/transactions/${expense.id}`)
        .send({ walletId: card.id })
        .expect(400);
    });

    it('returns 400 for a reserved transfer category', async () => {
      await api()
        .patch(`/transactions/${expense.id}`)
        .send({ categoryId: categories.transferIncome.id })
        .expect(400);

      expect(await getWalletBalance(db, wallet.id)).toBe(-1000);
    });

    it('returns 404 for an unknown category', async () => {
      await api()
        .patch(`/transactions/${expense.id}`)
        .send({ categoryId: createId() })
        .expect(404);

      expect(await getWalletBalance(db, wallet.id)).toBe(-1000);
    });

    it('returns 400 for a transfer leg', async () => {
      const transfer = await createTransfer(app, {
        fromWalletId: wallet.id,
        toWalletId: card.id,
        amountInCents: 500,
      });

      const res = await api()
        .patch(`/transactions/${transfer.transactions[0].id}`)
        .send({ amountInCents: 100 })
        .expect(400);

      expect(res.body.message).toBe(
        'Use the /transfer endpoints to modify transfer records',
      );
    });

    it.each([0, -1, 1.5, 'abc'])(
      'returns 400 for amountInCents = %p',
      async (amountInCents) => {
        await api()
          .patch(`/transactions/${expense.id}`)
          .send({ amountInCents })
          .expect(400);
      },
    );

    it('returns 400 for an invalid id', async () => {
      await api().patch('/transactions/not-a-cuid').send({}).expect(400);
    });

    it('returns 404 for an unknown transaction', async () => {
      await api().patch(`/transactions/${createId()}`).send({}).expect(404);
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('deletes the transaction and restores the balance', async () => {
      await setWalletBalance(db, wallet.id, 5000);
      const transaction = await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.food.id,
        amountInCents: 1000,
      });

      const res = await api()
        .delete(`/transactions/${transaction.id}`)
        .expect(204);

      expect(res.body).toEqual({});
      expect(await getWalletBalance(db, wallet.id)).toBe(5000);
      await api().get(`/transactions/${transaction.id}`).expect(404);
    });

    it('returns 404 when deleting twice', async () => {
      const transaction = await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.salary.id,
        amountInCents: 1000,
      });

      await api().delete(`/transactions/${transaction.id}`).expect(204);
      await api().delete(`/transactions/${transaction.id}`).expect(404);
      expect(await getWalletBalance(db, wallet.id)).toBe(0);
    });

    it('returns 400 for a transfer leg and keeps both legs', async () => {
      const transfer = await createTransfer(app, {
        fromWalletId: wallet.id,
        toWalletId: card.id,
        amountInCents: 500,
      });

      await api()
        .delete(`/transactions/${transfer.transactions[0].id}`)
        .expect(400);

      expect(await countTransactions(db)).toBe(2);
      expect(await getWalletBalance(db, wallet.id)).toBe(-500);
    });

    it('returns 400 for an invalid id', async () => {
      await api().delete('/transactions/not-a-cuid').expect(400);
    });

    it('returns 404 for an unknown transaction', async () => {
      await api().delete(`/transactions/${createId()}`).expect(404);
    });
  });
});
