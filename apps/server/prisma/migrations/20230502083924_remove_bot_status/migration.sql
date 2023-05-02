/*
  Warnings:

  - The values [FUNDED,REFUND_PROCESSED] on the enum `QueueStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `botTransactionHash` on the `AdminEthereumQueue` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "QueueStatus_new" AS ENUM ('DRAFT', 'IN_PROGRESS', 'COMPLETED', 'ERROR', 'REJECTED', 'EXPIRED', 'REFUND_REQUESTED', 'REFUNDED');
ALTER TABLE "EthereumQueue" ALTER COLUMN "status" TYPE "QueueStatus_new" USING ("status"::text::"QueueStatus_new");
ALTER TYPE "QueueStatus" RENAME TO "QueueStatus_old";
ALTER TYPE "QueueStatus_new" RENAME TO "QueueStatus";
DROP TYPE "QueueStatus_old";
COMMIT;

-- DropIndex
DROP INDEX "AdminEthereumQueue_botTransactionHash_key";

-- AlterTable
ALTER TABLE "AdminEthereumQueue" DROP COLUMN "botTransactionHash";
