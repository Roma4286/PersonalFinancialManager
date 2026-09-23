import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { Kysely, PostgresDialect, Transaction } from 'kysely';
import { setTimeout } from 'node:timers/promises';
import { DB } from '@/db/types';

const MAX_TRANSACTION_ATTEMPTS = 3;
const RETRY_BASE_DELAY_IN_MS = 20;
// 40001 serialization_failure, 40P01 deadlock_detected
const RETRYABLE_ERROR_CODES = new Set(['40001', '40P01']);

function isRetryableError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    RETRYABLE_ERROR_CODES.has(err.code as string)
  );
}

@Injectable()
export class KyselyService extends Kysely<DB> implements OnModuleDestroy {
  constructor() {
    const dialect = new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    });

    super({ dialect });
  }

  async serializableTransaction<T>(
    callback: (tx: Transaction<DB>) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.transaction()
          .setIsolationLevel('serializable')
          .execute(callback);
      } catch (err) {
        if (attempt >= MAX_TRANSACTION_ATTEMPTS || !isRetryableError(err)) {
          throw err;
        }

        await setTimeout(
          RETRY_BASE_DELAY_IN_MS * attempt +
            Math.random() * RETRY_BASE_DELAY_IN_MS,
        );
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.destroy();
  }
}
