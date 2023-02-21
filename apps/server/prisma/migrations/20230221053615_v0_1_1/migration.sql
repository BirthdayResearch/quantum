/*
  Warnings:

  - A unique constraint covering the columns `[transactionHash]` on the table `BridgeEventTransactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BridgeEventTransactions_transactionHash_key" ON "BridgeEventTransactions"("transactionHash");
