-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExchangeApiKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exchangeName" TEXT NOT NULL,
    "label" TEXT,
    "apiKey" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "password" TEXT,
    "uid" TEXT,
    "privateKey" TEXT,
    "walletAddress" TEXT,
    "options" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExchangeApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExchangeDeposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exchangeName" TEXT NOT NULL,
    "txId" TEXT NOT NULL,
    "txTimestamp" DATETIME NOT NULL,
    "symbol" TEXT NOT NULL,
    "network" TEXT,
    "amount" REAL NOT NULL,
    "address" TEXT NOT NULL,
    "tag" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fee" REAL,
    "feeCurrency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExchangeDeposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExchangeWithdrawal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exchangeName" TEXT NOT NULL,
    "txId" TEXT,
    "txTimestamp" DATETIME NOT NULL,
    "symbol" TEXT NOT NULL,
    "network" TEXT,
    "amount" REAL NOT NULL,
    "address" TEXT NOT NULL,
    "tag" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fee" REAL,
    "feeCurrency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExchangeWithdrawal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "exchangeName" TEXT NOT NULL,
    "orderExtId" TEXT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "price" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filled" REAL NOT NULL DEFAULT 0,
    "remaining" REAL NOT NULL DEFAULT 0,
    "fee" REAL,
    "feeCurrency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TradeOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TradeOperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "details" JSONB,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradeOperation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TradeOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clientId_key" ON "User"("clientId");

-- CreateIndex
CREATE INDEX "User_clientId_idx" ON "User"("clientId");

-- CreateIndex
CREATE INDEX "ExchangeApiKey_userId_exchangeName_idx" ON "ExchangeApiKey"("userId", "exchangeName");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeApiKey_userId_exchangeName_label_key" ON "ExchangeApiKey"("userId", "exchangeName", "label");

-- CreateIndex
CREATE INDEX "ExchangeDeposit_userId_exchangeName_symbol_idx" ON "ExchangeDeposit"("userId", "exchangeName", "symbol");

-- CreateIndex
CREATE INDEX "ExchangeDeposit_txTimestamp_idx" ON "ExchangeDeposit"("txTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeDeposit_exchangeName_txId_key" ON "ExchangeDeposit"("exchangeName", "txId");

-- CreateIndex
CREATE INDEX "ExchangeWithdrawal_userId_exchangeName_symbol_idx" ON "ExchangeWithdrawal"("userId", "exchangeName", "symbol");

-- CreateIndex
CREATE INDEX "ExchangeWithdrawal_txTimestamp_idx" ON "ExchangeWithdrawal"("txTimestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeWithdrawal_exchangeName_txId_key" ON "ExchangeWithdrawal"("exchangeName", "txId");

-- CreateIndex
CREATE INDEX "TradeOrder_userId_exchangeName_symbol_idx" ON "TradeOrder"("userId", "exchangeName", "symbol");

-- CreateIndex
CREATE INDEX "TradeOrder_clientId_idx" ON "TradeOrder"("clientId");

-- CreateIndex
CREATE INDEX "TradeOrder_status_idx" ON "TradeOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TradeOrder_exchangeName_orderExtId_key" ON "TradeOrder"("exchangeName", "orderExtId");

-- CreateIndex
CREATE INDEX "TradeOperation_orderId_idx" ON "TradeOperation"("orderId");
