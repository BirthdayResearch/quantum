-- CreateEnum
CREATE TYPE "EthereumTransactionStatus" AS ENUM ('NOT_CONFIRMED', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "BotStatus" AS ENUM ('COMPLETE', 'CANNOT_COMPLETE', 'TOKEN_NOT_FOUND', 'NO_UTXO', 'SENT', 'ERROR');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'FUNDED', 'COMPLETED', 'ERROR', 'REJECTED', 'EXPIRED', 'REFUND_REQUESTED', 'REFUND_PROCESSED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DeFiChainTransactionStatus" AS ENUM ('NOT_CONFIRMED', 'CONFIRMED');

-- CreateTable
CREATE TABLE "DeFiChainAddressIndex" (
    "id" BIGSERIAL NOT NULL,
    "index" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "refundAddress" TEXT NOT NULL,
    "claimNonce" TEXT,
    "claimDeadline" TEXT,
    "claimSignature" TEXT,
    "claimAmount" TEXT,
    "tokenSymbol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "hotWalletAddress" TEXT NOT NULL,
    "ethReceiverAddress" TEXT,
    "botStatus" "BotStatus",

    CONSTRAINT "DeFiChainAddressIndex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BridgeEventTransactions" (
    "id" BIGSERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "status" "EthereumTransactionStatus" NOT NULL,
    "sendTransactionHash" TEXT,
    "unconfirmedSendTransactionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "amount" TEXT,
    "tokenSymbol" TEXT,
    "blockHash" TEXT,
    "blockHeight" TEXT,

    CONSTRAINT "BridgeEventTransactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EthereumQueue" (
    "id" BIGSERIAL NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "ethereumStatus" "EthereumTransactionStatus" NOT NULL,
    "status" "QueueStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "amount" TEXT,
    "tokenSymbol" TEXT,
    "defichainAddress" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EthereumQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminEthereumQueue" (
    "id" BIGSERIAL NOT NULL,
    "queueTransactionHash" TEXT NOT NULL,
    "lastUpdatedBy" TEXT,
    "hotWalletAddress" TEXT,
    "hotWalletIndex" INTEGER,
    "generatedAddress" TEXT,
    "sendTransactionHash" TEXT,
    "defichainStatus" "DeFiChainTransactionStatus" NOT NULL,
    "hasVerified" BOOLEAN,
    "blockHash" TEXT,
    "blockHeight" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "botTransactionHash" TEXT,

    CONSTRAINT "AdminEthereumQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeFiChainAddressIndex_address_key" ON "DeFiChainAddressIndex"("address");

-- CreateIndex
CREATE UNIQUE INDEX "DeFiChainAddressIndex_hotWalletAddress_index_key" ON "DeFiChainAddressIndex"("hotWalletAddress", "index");

-- CreateIndex
CREATE UNIQUE INDEX "BridgeEventTransactions_transactionHash_key" ON "BridgeEventTransactions"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "EthereumQueue_transactionHash_key" ON "EthereumQueue"("transactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEthereumQueue_queueTransactionHash_key" ON "AdminEthereumQueue"("queueTransactionHash");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEthereumQueue_generatedAddress_key" ON "AdminEthereumQueue"("generatedAddress");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEthereumQueue_hotWalletAddress_hotWalletIndex_key" ON "AdminEthereumQueue"("hotWalletAddress", "hotWalletIndex");

-- AddForeignKey
ALTER TABLE "AdminEthereumQueue" ADD CONSTRAINT "AdminEthereumQueue_queueTransactionHash_fkey" FOREIGN KEY ("queueTransactionHash") REFERENCES "EthereumQueue"("transactionHash") ON DELETE RESTRICT ON UPDATE CASCADE;
