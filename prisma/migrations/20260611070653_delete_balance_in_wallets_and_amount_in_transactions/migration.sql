/*
  Warnings:

  - You are about to drop the column `amount` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `balance` on the `Wallet` table. All the data in the column will be lost.
  - Made the column `amountInCents` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "amount",
ALTER COLUMN "amountInCents" SET NOT NULL;

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "balance";
