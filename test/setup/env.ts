import { config } from 'dotenv';
import { resolve } from 'node:path';

config({
  path: resolve(__dirname, '../../.env.test'),
  override: true,
  quiet: true,
});

const databaseName = new URL(process.env.DATABASE_URL ?? '').pathname.slice(1);

if (!databaseName.endsWith('_test')) {
  throw new Error(
    `Refusing to run tests against "${databaseName}": database name must end with "_test"`,
  );
}
