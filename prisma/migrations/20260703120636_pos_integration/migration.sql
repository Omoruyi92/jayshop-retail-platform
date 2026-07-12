-- CreateTable
CREATE TABLE "PosApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "locationId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "PosApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosEvent" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "locationId" TEXT,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "errorReason" TEXT,
    "apiKeyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PosEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PosApiKey_keyHash_key" ON "PosApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "PosApiKey_active_idx" ON "PosApiKey"("active");

-- CreateIndex
CREATE UNIQUE INDEX "PosEvent_externalId_key" ON "PosEvent"("externalId");

-- CreateIndex
CREATE INDEX "PosEvent_createdAt_idx" ON "PosEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PosEvent_type_createdAt_idx" ON "PosEvent"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "PosApiKey" ADD CONSTRAINT "PosApiKey_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StoreLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosEvent" ADD CONSTRAINT "PosEvent_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "PosApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
