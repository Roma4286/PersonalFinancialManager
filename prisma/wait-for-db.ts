import 'dotenv/config';
import { Client } from 'pg';

const RETRY_INTERVAL_MS = 500;
const MAX_WAIT_MS = 30_000;

async function canConnect(): Promise<boolean> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main() {
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    if (await canConnect()) {
      console.log('Database is ready.');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
  }

  throw new Error(`Database did not become ready within ${MAX_WAIT_MS}ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
