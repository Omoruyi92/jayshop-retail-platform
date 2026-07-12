-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "jerseyNumber" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "heroImageUrl" TEXT NOT NULL,
    "imageUrls" TEXT NOT NULL DEFAULT '',
    "stats" JSONB,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isTrending" BOOLEAN NOT NULL DEFAULT false,
    "isNewArrival" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerProduct" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_slug_key" ON "Player"("slug");

-- CreateIndex
CREATE INDEX "Player_status_idx" ON "Player"("status");

-- CreateIndex
CREATE INDEX "Player_tenantId_idx" ON "Player"("tenantId");

-- CreateIndex
CREATE INDEX "Player_isFeatured_idx" ON "Player"("isFeatured");

-- CreateIndex
CREATE INDEX "Player_isTrending_idx" ON "Player"("isTrending");

-- CreateIndex
CREATE INDEX "PlayerProduct_playerId_idx" ON "PlayerProduct"("playerId");

-- CreateIndex
CREATE INDEX "PlayerProduct_productId_idx" ON "PlayerProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerProduct_playerId_productId_key" ON "PlayerProduct"("playerId", "productId");

-- AddForeignKey
ALTER TABLE "PlayerProduct" ADD CONSTRAINT "PlayerProduct_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerProduct" ADD CONSTRAINT "PlayerProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

