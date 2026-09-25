import { INestApplication } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Wallet } from '@prisma/client';
import request from 'supertest';
import { KyselyService } from '@/modules/kysely/kysely.service';
import { createTestApp } from '../helpers/create-app';
import {
  loadCategories,
  loadWallets,
  resetDb,
  setWalletBalance,
  TestCategories,
} from '../helpers/db';
import { createTransaction } from '../helpers/factories';
import { WALLET_RESPONSE_KEYS } from '../helpers/response-keys';

describe('Wallets (e2e)', () => {
  let app: INestApplication;
  let db: KyselyService;
  let categories: TestCategories;
  let wallet: Wallet;
  let card: Wallet;

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

  describe('GET /wallets', () => {
    it('returns the two seeded wallets', async () => {
      const res = await request(app.getHttpServer())
        .get('/wallets')
        .expect(200);

      expect(res.body).toHaveLength(2);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: wallet.id,
            name: 'Wallet',
            balanceInCents: 0,
          }),
          expect.objectContaining({
            id: card.id,
            name: 'Card',
            balanceInCents: 0,
          }),
        ]),
      );
    });

    it('returns only the response fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/wallets')
        .expect(200);

      for (const item of res.body) {
        expect(Object.keys(item).sort()).toEqual(WALLET_RESPONSE_KEYS);
      }
    });

    it('returns the current balance of each wallet', async () => {
      await setWalletBalance(db, card.id, 500);

      const res = await request(app.getHttpServer())
        .get('/wallets')
        .expect(200);

      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: wallet.id, balanceInCents: 0 }),
          expect.objectContaining({ id: card.id, balanceInCents: 500 }),
        ]),
      );
    });
  });

  describe('GET /wallets/:id/balance', () => {
    it('returns zero for a wallet without transactions', async () => {
      const res = await request(app.getHttpServer())
        .get(`/wallets/${wallet.id}/balance`)
        .expect(200);

      expect(res.body).toEqual({ totalBalanceInCents: 0 });
    });

    it('reflects created income and expense transactions', async () => {
      await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.salary.id,
        amountInCents: 10000,
      });
      await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.food.id,
        amountInCents: 2500,
      });

      const res = await request(app.getHttpServer())
        .get(`/wallets/${wallet.id}/balance`)
        .expect(200);

      expect(res.body).toEqual({ totalBalanceInCents: 7500 });
    });

    it('returns a negative balance when expenses exceed income', async () => {
      await createTransaction(app, {
        walletId: wallet.id,
        categoryId: categories.food.id,
        amountInCents: 5000,
      });

      const res = await request(app.getHttpServer())
        .get(`/wallets/${wallet.id}/balance`)
        .expect(200);

      expect(res.body).toEqual({ totalBalanceInCents: -5000 });
    });

    it('returns 400 for an invalid id', async () => {
      await request(app.getHttpServer())
        .get('/wallets/not-a-cuid/balance')
        .expect(400);
    });

    it('returns 404 for an unknown wallet', async () => {
      await request(app.getHttpServer())
        .get(`/wallets/${createId()}/balance`)
        .expect(404);
    });
  });
});
