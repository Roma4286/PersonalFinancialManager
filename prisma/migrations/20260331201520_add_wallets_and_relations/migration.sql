/*
  Warnings:

  - A unique constraint covering the columns `[name,type]` on the table `Categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `walletId` to the `Transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Categories_name_key";

-- AlterTable
ALTER TABLE "Transactions" ADD COLUMN     "walletId" INTEGER NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Wallets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallets_name_key" ON "Wallets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Categories_name_type_key" ON "Categories"("name", "type");

-- AddForeignKey
ALTER TABLE "Transactions" ADD CONSTRAINT "Transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
