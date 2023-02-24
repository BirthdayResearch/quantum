/*
  Warnings:

  - A unique constraint covering the columns `[hotWalletAddress,index]` on the table `DeFiChainAddressIndex` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hotWalletAddress` to the `DeFiChainAddressIndex` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DeFiChainAddressIndex_index_key";

-- AlterTable
ALTER TABLE "DeFiChainAddressIndex" ADD COLUMN "hotWalletAddress" TEXT NOT NULL DEFAULT '';

-- AlterTable drop default
ALTER TABLE "DeFiChainAddressIndex" ALTER COLUMN "hotWalletAddress" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "DeFiChainAddressIndex_hotWalletAddress_index_key" ON "DeFiChainAddressIndex"("hotWalletAddress", "index");
