-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "amountInCents" INTEGER;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "balanceInCents" INTEGER NOT NULL DEFAULT 0;

-- DataMigration
UPDATE "Wallet"
SET "balanceInCents" = ROUND("balance" * 100)::INTEGER;

UPDATE "Transaction" AS t
SET "amountInCents" = ROUND(t."amount" * 100)::INTEGER
  * CASE WHEN c."type" = 'EXPENSE' THEN -1 ELSE 1 END
FROM "Category" AS c
WHERE t."categoryId" = c."id";
