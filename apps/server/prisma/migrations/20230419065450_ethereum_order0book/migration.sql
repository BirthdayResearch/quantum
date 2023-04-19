-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'REJECTED', 'EXPIRED', 'REFUND_REQUESTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DeFiChainTransactionStatus" AS ENUM ('NOT_CONFIRMED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "EthereumOrders" (
    "id" BIGSERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "ethereumStatus" "EthereumTransactionStatus" NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "defichainStatus" "DeFiChainTransactionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "amount" TEXT,
    "tokenSymbol" TEXT,
    "defichainAddress" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EthereumOrders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminEthereumOrders" (
    "id" BIGSERIAL NOT NULL,
    "orderId" BIGINT NOT NULL,
    "lastUpdatedBy" TEXT NOT NULL,
    "hotWalletAddress" TEXT NOT NULL,
    "hotWalletIndex" INTEGER NOT NULL,
    "generatedAddress" TEXT NOT NULL,
    "sendTransactionHash" TEXT,
    "hasVerified" BOOLEAN NOT NULL,
    "blockHash" TEXT,
    "blockHeight" TEXT,

    CONSTRAINT "AdminEthereumOrders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EthereumOrders_transactionHash_key" ON "EthereumOrders"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEthereumOrders_orderId_key" ON "AdminEthereumOrders"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEthereumOrders_generatedAddress_key" ON "AdminEthereumOrders"("generatedAddress");

-- AddForeignKey
ALTER TABLE "AdminEthereumOrders" ADD CONSTRAINT "AdminEthereumOrders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "EthereumOrders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
