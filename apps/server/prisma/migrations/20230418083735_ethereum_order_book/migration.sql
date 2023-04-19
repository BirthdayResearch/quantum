-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('IN_PROGRESS', 'COMPLETE', 'REJECTED', 'EXPIRED', 'REFUND_REQUESTED', 'REFUNDED');

-- CreateTable
CREATE TABLE "EthereumOrderTable" (
    "id" BIGSERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "ethereumStatus" "EthereumTransactionStatus" NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "amount" TEXT,
    "tokenSymbol" TEXT,
    "defiChainAddress" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EthereumOrderTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminEthereumOrderTable" (
    "id" BIGSERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "lastUpdatedBy" TEXT NOT NULL,
    "hotWalletAddress" TEXT NOT NULL,
    "hotWalletIndex" INTEGER NOT NULL,
    "sendTransactionHash" TEXT,
    "hasVerified" BOOLEAN NOT NULL,
    "blockHash" TEXT NOT NULL,
    "blockHeight" TEXT NOT NULL,

    CONSTRAINT "AdminEthereumOrderTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EthereumOrderTable_transactionHash_key" ON "EthereumOrderTable"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "EthereumOrderTable_defiChainAddress_key" ON "EthereumOrderTable"("defiChainAddress");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEthereumOrderTable_orderId_key" ON "AdminEthereumOrderTable"("orderId");
