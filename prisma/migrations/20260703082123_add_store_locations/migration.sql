-- AlterTable
ALTER TABLE "SizeInventory" ADD COLUMN     "locationId" TEXT;

-- CreateTable
CREATE TABLE "StoreLocation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT,
    "gate" TEXT,
    "isMainStore" BOOLEAN NOT NULL DEFAULT false,
    "isPickupQueue" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StoreLocation_code_key" ON "StoreLocation"("code");

-- CreateIndex
CREATE INDEX "StoreLocation_active_idx" ON "StoreLocation"("active");

-- AddForeignKey
ALTER TABLE "SizeInventory" ADD CONSTRAINT "SizeInventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StoreLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
