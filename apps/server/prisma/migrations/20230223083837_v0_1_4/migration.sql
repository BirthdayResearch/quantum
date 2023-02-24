/*
  Warnings:

  - You are about to drop the column `claimTransactionHash` on the `DeFiChainAddressIndex` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DeFiChainAddressIndex" DROP COLUMN "claimTransactionHash",
ADD COLUMN     "ethReceiverAddress" TEXT;
