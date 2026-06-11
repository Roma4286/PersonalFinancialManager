-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "amountInCents" INTEGER;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "balanceInCents" INTEGER NOT NULL DEFAULT 0;
