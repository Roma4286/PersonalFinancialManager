import './env';
import { execSync } from 'node:child_process';
import { Client } from 'pg';

async function ensureDatabaseExists(databaseUrl: string): Promise<void> {
  const url = new URL(databaseUrl);
  const databaseName = url.pathname.slice(1);
  url.pathname = '/postgres';

  const client = new Client({ connectionString: url.toString() });
  await client.connect();

  try {
    const { rowCount } = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );

    if (!rowCount) {
      await client.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await client.end();
  }
}

export default async function globalSetup(): Promise<void> {
  await ensureDatabaseExists(process.env.DATABASE_URL!);

  const options = { stdio: 'pipe', env: process.env } as const;
  execSync('npx prisma migrate deploy', options);
  execSync('npx prisma db seed', options);
}
