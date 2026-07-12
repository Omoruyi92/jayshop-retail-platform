-- =============================================================================
-- Jays Shop — Operational / Transactional Data Reset
-- =============================================================================
-- Purpose: Remove all operational records while preserving master data,
--          configuration, schema, and application structure.
--
-- Preserved master data:
--   Tenant, Product, StoreLocation, SizeInventory, Admin, SlackSettings,
--   HoldSettings, PosApiKey
--
-- Deleted operational data:
--   Hold, Customer, HoldHistory, SalesHistory, InventoryTransaction,
--   PosEvent, AuditLog, GameDay
--
-- Run with:
--   psql $DATABASE_URL -f scripts/reset-transactional-data.sql
-- Or via Prisma:
--   npx prisma db execute --file scripts/reset-transactional-data.sql
--
-- WARNING: This is destructive. Execute only after a verified backup.
-- =============================================================================

-- Disable triggers temporarily to avoid side effects during mass delete.
SET session_replication_role = 'replica';

-- Holds & customers (reservations and the transient customer records).
DELETE FROM "Hold";
DELETE FROM "Customer";

-- Historical / audit / analytics records.
DELETE FROM "HoldHistory";
DELETE FROM "SalesHistory";
DELETE FROM "InventoryTransaction";
DELETE FROM "PosEvent";
DELETE FROM "AuditLog";

-- Operational calendar events and logs.
DELETE FROM "GameDay";

-- Re-enable triggers.
SET session_replication_role = 'origin';

-- Reset inventory counters on SizeInventory so master quantities are fully available.
-- (quantity is kept because it represents master stock; held/picked are transaction-derived.)
UPDATE "SizeInventory"
SET "heldQuantity" = 0,
    "pickedQuantity" = 0;

-- Reset product-level aggregate counters to match restored SizeInventory state.
UPDATE "Product"
SET "heldQuantity" = 0,
    "pickedQuantity" = 0,
    "quantity" = COALESCE((
      SELECT SUM(si.quantity)
      FROM "SizeInventory" si
      WHERE si."productId" = "Product".id
    ), 0),
    "status" = 'AVAILABLE',
    "updatedAt" = NOW();

-- Ensure single HoldSettings row exists with sane defaults.
INSERT INTO "HoldSettings" ("id", "enable48HourHold", "standardHoldHours", "extendedHoldHours")
SELECT gen_random_uuid(), true, 4, 48
WHERE NOT EXISTS (SELECT 1 FROM "HoldSettings" LIMIT 1);

-- Maintain idempotency on history tables that may have partial resets.
-- (No-op if tables are already empty.)
