-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "isLicensed" BOOLEAN NOT NULL DEFAULT false,
    "isChampion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("brand", "category", "createdAt", "description", "heldQuantity", "id", "imageUrl", "name", "pickedQuantity", "priceCents", "quantity", "sizes", "slug", "status", "subcategory", "updatedAt") SELECT "brand", "category", "createdAt", "description", "heldQuantity", "id", "imageUrl", "name", "pickedQuantity", "priceCents", "quantity", "sizes", "slug", "status", "subcategory", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_brand_idx" ON "Product"("brand");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
