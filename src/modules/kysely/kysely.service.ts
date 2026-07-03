import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { DB } from '@/db/types';

@Injectable()
export class KyselyService extends Kysely<DB> implements OnModuleDestroy {
  constructor(configService: ConfigService) {
    const dialect = new PostgresDialect({
      pool: new Pool({
        connectionString: configService.get<string>('DATABASE_URL'),
      }),
    });

    super({ dialect });
  }
  async onModuleDestroy(): Promise<void> {
    await this.destroy();
  }
}
