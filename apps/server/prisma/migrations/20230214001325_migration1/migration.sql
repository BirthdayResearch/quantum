-- CreateEnum
CREATE TYPE "EthereumTransactionStatus" AS ENUM ('NOT_CONFIRMED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "DeFiChainAddressIndex" (
    "id" BIGSERIAL NOT NULL,
    "index" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeFiChainAddressIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BridgeEventTransactions" (
    "id" BIGSERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "status" "EthereumTransactionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "BridgeEventTransactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeFiChainAddressIndex_index_key" ON "DeFiChainAddressIndex"("index");

-- CreateIndex
CREATE UNIQUE INDEX "DeFiChainAddressIndex_address_key" ON "DeFiChainAddressIndex"("address");
