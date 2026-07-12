--
-- 1. Create the Tenant table with only its own data.
--    The FK columns are added as nullable first so existing rows
--    don't fail, then backfilled from the default tenant.
--

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_isDefault_idx" ON "Tenant"("isDefault");

--
-- 2. Create a single default tenant and capture its id in a session var.
--
INSERT INTO "Tenant" ("id", "name", "slug", "isDefault")
VALUES (gen_random_uuid(), 'Default', 'default', true);

--
-- 3. Add nullable tenantId columns, backfill from the default tenant,
--    then make them NOT NULL and attach the FKs.
--

-- Admin
ALTER TABLE "Admin" ADD COLUMN "tenantId" TEXT;
UPDATE "Admin" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "isDefault" = true LIMIT 1);
ALTER TABLE "Admin" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Product
ALTER TABLE "Product" ADD COLUMN "tenantId" TEXT;
UPDATE "Product" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "isDefault" = true LIMIT 1);
ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- StoreLocation
ALTER TABLE "StoreLocation" ADD COLUMN "tenantId" TEXT;
UPDATE "StoreLocation" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "isDefault" = true LIMIT 1);
ALTER TABLE "StoreLocation" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "StoreLocation" ADD CONSTRAINT "StoreLocation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- 4. Indexes for tenant-scoped queries.
--
CREATE INDEX "Admin_tenantId_idx" ON "Admin"("tenantId");
CREATE INDEX "Product_tenantId_idx" ON "Product"("tenantId");
CREATE INDEX "Product_tenantId_slug_idx" ON "Product"("tenantId", "slug");
CREATE INDEX "StoreLocation_tenantId_idx" ON "StoreLocation"("tenantId");
CREATE INDEX "StoreLocation_tenantId_code_idx" ON "StoreLocation"("tenantId", "code");
