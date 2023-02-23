-- CreateEnum
CREATE TYPE "BotStatus" AS ENUM ('SENT', 'ERROR');

-- AlterTable
ALTER TABLE "DeFiChainAddressIndex" ADD COLUMN     "botStatus" "BotStatus";
