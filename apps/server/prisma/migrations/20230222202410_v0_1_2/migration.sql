-- AlterTable
ALTER TABLE "DeFiChainAddressIndex" ADD COLUMN     "claimDeadline" TEXT,
ADD COLUMN     "claimNonce" TEXT,
ADD COLUMN     "claimSignature" TEXT,
ADD COLUMN     "claimTransactionHash" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);
