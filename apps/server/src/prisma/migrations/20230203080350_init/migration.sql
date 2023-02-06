-- CreateEnum
CREATE TYPE "Network" AS ENUM ('Local', 'Playground', 'MainNet', 'TestNet', 'DevNet');

-- CreateTable
CREATE TABLE "PathIndex" (
    "id" BIGSERIAL NOT NULL,
    "index" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "network" "Network" NOT NULL,
    "refundAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PathIndex_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PathIndex_index_network_key" ON "PathIndex"("index", "network");
