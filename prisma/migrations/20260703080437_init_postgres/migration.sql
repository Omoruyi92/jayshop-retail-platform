-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'accessories',
    "subcategory" TEXT NOT NULL DEFAULT '',
    "ageGroup" TEXT NOT NULL DEFAULT '',
    "hatStyle" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "heldQuantity" INTEGER NOT NULL DEFAULT 0,
    "pickedQuantity" INTEGER NOT NULL DEFAULT 0,
    "sizes" TEXT NOT NULL DEFAULT '',
    "brand" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "isLicensed" BOOLEAN NOT NULL DEFAULT false,
    "isChampion" BOOLEAN NOT NULL DEFAULT false,
    "isBestSeller" BOOLEAN NOT NULL DEFAULT false,
    "isClearance" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hold" (
    "id" TEXT NOT NULL,
    "reservationCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerNameSnapshot" TEXT NOT NULL DEFAULT '',
    "size" TEXT,
    "holdQuantity" INTEGER NOT NULL DEFAULT 1,
    "totalPriceCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "pickedUpAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "notifiedStaffAt" TIMESTAMP(3),
    "isStadiumHold" BOOLEAN NOT NULL DEFAULT false,
    "pickupQueueAt" TIMESTAMP(3),
    "queuePosition" INTEGER,

    CONSTRAINT "Hold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeInventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "heldQuantity" INTEGER NOT NULL DEFAULT 0,
    "pickedQuantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SizeInventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "passwordUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlackSettings" (
    "id" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "interactiveEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SlackSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoldHistory" (
    "id" TEXT NOT NULL,
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
    "placedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "finalStatus" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3) NOT NULL,
    "resolvedByAdminId" TEXT,
    "notes" TEXT,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "HoldHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesHistory" (
    "id" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "reservationCode" TEXT NOT NULL,
    "productId" TEXT,
    "productNameSnapshot" TEXT NOT NULL,
    "salePriceCentsSnapshot" INTEGER NOT NULL,
    "holdQuantity" INTEGER NOT NULL DEFAULT 1,
    "fulfilledQuantity" INTEGER NOT NULL DEFAULT 1,
    "customerId" TEXT,
    "customerPhoneSnapshot" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "soldByAdminId" TEXT,

    CONSTRAINT "SalesHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "Product_category_idx" ON "Product"("category");

-- CreateIndex
CREATE INDEX "Product_brand_idx" ON "Product"("brand");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Hold_reservationCode_key" ON "Hold"("reservationCode");

-- CreateIndex
CREATE INDEX "Hold_productId_status_idx" ON "Hold"("productId", "status");

-- CreateIndex
CREATE INDEX "Hold_status_expiresAt_idx" ON "Hold"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Hold_customerId_idx" ON "Hold"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "SizeInventory_productId_size_key" ON "SizeInventory"("productId", "size");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HoldHistory_holdId_key" ON "HoldHistory"("holdId");

-- CreateIndex
CREATE INDEX "HoldHistory_finalStatus_idx" ON "HoldHistory"("finalStatus");

-- CreateIndex
CREATE INDEX "HoldHistory_resolvedAt_idx" ON "HoldHistory"("resolvedAt");

-- CreateIndex
CREATE INDEX "HoldHistory_customerPhoneSnapshot_idx" ON "HoldHistory"("customerPhoneSnapshot");

-- CreateIndex
CREATE INDEX "HoldHistory_productId_idx" ON "HoldHistory"("productId");

-- CreateIndex
CREATE INDEX "HoldHistory_resolvedByAdminId_idx" ON "HoldHistory"("resolvedByAdminId");

-- CreateIndex
CREATE INDEX "HoldHistory_archivedAt_idx" ON "HoldHistory"("archivedAt");

-- CreateIndex
CREATE INDEX "SalesHistory_soldAt_idx" ON "SalesHistory"("soldAt");

-- CreateIndex
CREATE INDEX "SalesHistory_soldByAdminId_idx" ON "SalesHistory"("soldByAdminId");

-- CreateIndex
CREATE INDEX "SalesHistory_productId_idx" ON "SalesHistory"("productId");

-- CreateIndex
CREATE INDEX "SalesHistory_customerPhoneSnapshot_idx" ON "SalesHistory"("customerPhoneSnapshot");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "Hold" ADD CONSTRAINT "Hold_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hold" ADD CONSTRAINT "Hold_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SizeInventory" ADD CONSTRAINT "SizeInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoldHistory" ADD CONSTRAINT "HoldHistory_resolvedByAdminId_fkey" FOREIGN KEY ("resolvedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesHistory" ADD CONSTRAINT "SalesHistory_soldByAdminId_fkey" FOREIGN KEY ("soldByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
