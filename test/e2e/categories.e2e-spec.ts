import { INestApplication } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import request from 'supertest';
import { createTestApp } from '../helpers/create-app';
import { CATEGORY_RESPONSE_KEYS } from '../helpers/response-keys';

describe('Categories (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /categories', () => {
    it('returns seeded categories including both reserved transfer categories', async () => {
      const res = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Food',
            type: TransactionType.EXPENSE,
          }),
          expect.objectContaining({
            name: 'Salary',
            type: TransactionType.INCOME,
          }),
          expect.objectContaining({
            id: process.env.TRANSFER_EXPENSE_CATEGORY_ID,
            name: 'Transfer',
            type: TransactionType.EXPENSE,
          }),
          expect.objectContaining({
            id: process.env.TRANSFER_INCOME_CATEGORY_ID,
            name: 'Transfer',
            type: TransactionType.INCOME,
          }),
        ]),
      );
    });

    it('returns only the response fields', async () => {
      const res = await request(app.getHttpServer())
        .get('/categories')
        .expect(200);

      for (const category of res.body) {
        expect(Object.keys(category).sort()).toEqual(CATEGORY_RESPONSE_KEYS);
      }
    });
  });
});
