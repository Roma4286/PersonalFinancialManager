import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { DB } from '@/db/types';

@Injectable()
export class KyselyService extends Kysely<DB> {
  constructor() {
    const dialect = new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    });

    super({ dialect });
  }
}
