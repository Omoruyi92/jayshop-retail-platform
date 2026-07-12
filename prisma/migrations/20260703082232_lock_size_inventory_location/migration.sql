-- DropForeignKey
ALTER TABLE "SizeInventory" DROP CONSTRAINT "SizeInventory_locationId_fkey";

-- DropIndex
DROP INDEX "SizeInventory_productId_size_key";

-- AlterTable
ALTER TABLE "SizeInventory" ALTER COLUMN "locationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "SizeInventory_locationId_productId_idx" ON "SizeInventory"("locationId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "SizeInventory_productId_size_locationId_key" ON "SizeInventory"("productId", "size", "locationId");

-- AddForeignKey
ALTER TABLE "SizeInventory" ADD CONSTRAINT "SizeInventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "StoreLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

