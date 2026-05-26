-- CreateTable
CREATE TABLE "SizeInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "heldQuantity" INTEGER NOT NULL DEFAULT 0,
    "pickedQuantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SizeInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Hold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reservationCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "size" TEXT,
    "holdQuantity" INTEGER NOT NULL DEFAULT 1,
    "totalPriceCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "placedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "pickedUpAt" DATETIME,
    "releasedAt" DATETIME,
    "notifiedStaffAt" DATETIME,
    "isStadiumHold" BOOLEAN NOT NULL DEFAULT false,
    "pickupQueueAt" DATETIME,
    "queuePosition" INTEGER,
    CONSTRAINT "Hold_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Hold_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Hold" ("customerId", "expiresAt", "holdQuantity", "id", "notifiedStaffAt", "pickedUpAt", "placedAt", "productId", "releasedAt", "reservationCode", "size", "status", "totalPriceCents") SELECT "customerId", "expiresAt", "holdQuantity", "id", "notifiedStaffAt", "pickedUpAt", "placedAt", "productId", "releasedAt", "reservationCode", "size", "status", "totalPriceCents" FROM "Hold";
DROP TABLE "Hold";
ALTER TABLE "new_Hold" RENAME TO "Hold";
CREATE UNIQUE INDEX "Hold_reservationCode_key" ON "Hold"("reservationCode");
CREATE INDEX "Hold_productId_status_idx" ON "Hold"("productId", "status");
CREATE INDEX "Hold_status_expiresAt_idx" ON "Hold"("status", "expiresAt");
CREATE INDEX "Hold_customerId_idx" ON "Hold"("customerId");
CREATE TABLE "new_HoldHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "holdId" TEXT,
    "reservationCode" TEXT NOT NULL,
    "productId" TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "productBrandSnapshot" TEXT NOT NULL DEFAULT '',
    "productPriceCentsSnapshot" INTEGER NOT NULL,
    "productImageUrlSnapshot" TEXT NOT NULL,
    "customerId" TEXT,
    "customerNameSnapshot" TEXT NOT NULL,
    "customerPhoneSnapshot" TEXT NOT NULL,
    "holdQuantity" INTEGER NOT NULL DEFAULT 1,
    "fulfilledQuantity" INTEGER NOT NULL DEFAULT 1,
    "totalPriceCentsSnapshot" INTEGER NOT NULL DEFAULT 0,
    "finalTotalCents" INTEGER NOT NULL DEFAULT 0,
    "placedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "finalStatus" TEXT NOT NULL,
    "resolvedAt" DATETIME NOT NULL,
    "resolvedByAdminId" TEXT,
    "notes" TEXT,
    "archivedAt" DATETIME,
    CONSTRAINT "HoldHistory_resolvedByAdminId_fkey" FOREIGN KEY ("resolvedByAdminId") REFERENCES "Admin" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_HoldHistory" ("archivedAt", "customerId", "customerNameSnapshot", "customerPhoneSnapshot", "expiresAt", "finalStatus", "finalTotalCents", "fulfilledQuantity", "holdId", "holdQuantity", "id", "notes", "placedAt", "productId", "productImageUrlSnapshot", "productNameSnapshot", "productPriceCentsSnapshot", "reservationCode", "resolvedAt", "resolvedByAdminId", "totalPriceCentsSnapshot") SELECT "archivedAt", "customerId", "customerNameSnapshot", "customerPhoneSnapshot", "expiresAt", "finalStatus", "finalTotalCents", "fulfilledQuantity", "holdId", "holdQuantity", "id", "notes", "placedAt", "productId", "productImageUrlSnapshot", "productNameSnapshot", "productPriceCentsSnapshot", "reservationCode", "resolvedAt", "resolvedByAdminId", "totalPriceCentsSnapshot" FROM "HoldHistory";
DROP TABLE "HoldHistory";
ALTER TABLE "new_HoldHistory" RENAME TO "HoldHistory";
CREATE UNIQUE INDEX "HoldHistory_holdId_key" ON "HoldHistory"("holdId");
CREATE INDEX "HoldHistory_finalStatus_idx" ON "HoldHistory"("finalStatus");
CREATE INDEX "HoldHistory_resolvedAt_idx" ON "HoldHistory"("resolvedAt");
CREATE INDEX "HoldHistory_customerPhoneSnapshot_idx" ON "HoldHistory"("customerPhoneSnapshot");
CREATE INDEX "HoldHistory_productId_idx" ON "HoldHistory"("productId");
CREATE INDEX "HoldHistory_resolvedByAdminId_idx" ON "HoldHistory"("resolvedByAdminId");
CREATE INDEX "HoldHistory_archivedAt_idx" ON "HoldHistory"("archivedAt");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'accessories',
    "subcategory" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "heldQuantity" INTEGER NOT NULL DEFAULT 0,
    "pickedQuantity" INTEGER NOT NULL DEFAULT 0,
    "sizes" TEXT NOT NULL DEFAULT '',
    "brand" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("category", "createdAt", "description", "heldQuantity", "id", "imageUrl", "name", "pickedQuantity", "priceCents", "quantity", "sizes", "slug", "status", "subcategory", "updatedAt") SELECT "category", "createdAt", "description", "heldQuantity", "id", "imageUrl", "name", "pickedQuantity", "priceCents", "quantity", "sizes", "slug", "status", "subcategory", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SizeInventory_productId_idx" ON "SizeInventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SizeInventory_productId_size_key" ON "SizeInventory"("productId", "size");
