-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "passwordUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Admin" ("createdAt", "email", "id", "passwordHash", "role") SELECT "createdAt", "email", "id", "passwordHash", "role" FROM "Admin";
DROP TABLE "Admin";
ALTER TABLE "new_Admin" RENAME TO "Admin";
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
CREATE TABLE "new_Hold" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reservationCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerNameSnapshot" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_Hold" ("customerId", "expiresAt", "holdQuantity", "id", "isStadiumHold", "notifiedStaffAt", "pickedUpAt", "pickupQueueAt", "placedAt", "productId", "queuePosition", "releasedAt", "reservationCode", "size", "status", "totalPriceCents") SELECT "customerId", "expiresAt", "holdQuantity", "id", "isStadiumHold", "notifiedStaffAt", "pickedUpAt", "pickupQueueAt", "placedAt", "productId", "queuePosition", "releasedAt", "reservationCode", "size", "status", "totalPriceCents" FROM "Hold";
DROP TABLE "Hold";
ALTER TABLE "new_Hold" RENAME TO "Hold";
CREATE UNIQUE INDEX "Hold_reservationCode_key" ON "Hold"("reservationCode");
CREATE INDEX "Hold_productId_status_idx" ON "Hold"("productId", "status");
CREATE INDEX "Hold_status_expiresAt_idx" ON "Hold"("status", "expiresAt");
CREATE INDEX "Hold_customerId_idx" ON "Hold"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
