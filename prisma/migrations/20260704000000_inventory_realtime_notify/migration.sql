-- Phase 8: Real-time inventory synchronization via PG LISTEN/NOTIFY.
--
-- Two trigger functions emit pg_notify() on commit-visible row changes:
--   inventory_changed  <- SizeInventory (INSERT/UPDATE/DELETE)
--   hold_changed       <- Hold          (INSERT/UPDATE/DELETE)
--
-- Both functions are intentionally cheap: they read only NEW/OLD (no
-- SELECTs), skip no-op updates, and emit a small JSON payload. This works
-- identically against local Postgres (Colima/Docker) and Supabase, since
-- both support LISTEN/NOTIFY over logical replication.

CREATE OR REPLACE FUNCTION notify_inventory_change() RETURNS trigger AS $$
DECLARE
  payload JSON;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Skip no-op updates (nothing fan/admin-visible actually changed).
    IF NEW."quantity" IS NOT DISTINCT FROM OLD."quantity"
       AND NEW."heldQuantity" IS NOT DISTINCT FROM OLD."heldQuantity"
       AND NEW."pickedQuantity" IS NOT DISTINCT FROM OLD."pickedQuantity" THEN
      RETURN NEW;
    END IF;
    payload := json_build_object(
      'productId', NEW."productId",
      'size', NEW."size",
      'locationId', NEW."locationId",
      'oldQty', OLD."quantity" - OLD."heldQuantity" - OLD."pickedQuantity",
      'newQty', NEW."quantity" - NEW."heldQuantity" - NEW."pickedQuantity",
      'op', TG_OP,
      'ts', extract(epoch from clock_timestamp()) * 1000
    );
  ELSIF TG_OP = 'INSERT' THEN
    payload := json_build_object(
      'productId', NEW."productId",
      'size', NEW."size",
      'locationId', NEW."locationId",
      'oldQty', 0,
      'newQty', NEW."quantity" - NEW."heldQuantity" - NEW."pickedQuantity",
      'op', TG_OP,
      'ts', extract(epoch from clock_timestamp()) * 1000
    );
  ELSE -- DELETE
    payload := json_build_object(
      'productId', OLD."productId",
      'size', OLD."size",
      'locationId', OLD."locationId",
      'oldQty', OLD."quantity" - OLD."heldQuantity" - OLD."pickedQuantity",
      'newQty', 0,
      'op', TG_OP,
      'ts', extract(epoch from clock_timestamp()) * 1000
    );
  END IF;

  PERFORM pg_notify('inventory_changed', payload::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_hold_change() RETURNS trigger AS $$
DECLARE
  payload JSON;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Skip no-op updates (status + queue position unchanged).
    IF NEW."status" IS NOT DISTINCT FROM OLD."status"
       AND NEW."queuePosition" IS NOT DISTINCT FROM OLD."queuePosition"
       AND NEW."pickupQueueAt" IS NOT DISTINCT FROM OLD."pickupQueueAt" THEN
      RETURN NEW;
    END IF;
    payload := json_build_object(
      'holdId', NEW."id",
      'productId', NEW."productId",
      'size', NEW."size",
      'status', NEW."status",
      'op', TG_OP,
      'ts', extract(epoch from clock_timestamp()) * 1000
    );
  ELSIF TG_OP = 'INSERT' THEN
    payload := json_build_object(
      'holdId', NEW."id",
      'productId', NEW."productId",
      'size', NEW."size",
      'status', NEW."status",
      'op', TG_OP,
      'ts', extract(epoch from clock_timestamp()) * 1000
    );
  ELSE -- DELETE
    payload := json_build_object(
      'holdId', OLD."id",
      'productId', OLD."productId",
      'size', OLD."size",
      'status', OLD."status",
      'op', TG_OP,
      'ts', extract(epoch from clock_timestamp()) * 1000
    );
  END IF;

  PERFORM pg_notify('hold_changed', payload::text);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS size_inventory_notify_trigger ON "SizeInventory";
CREATE TRIGGER size_inventory_notify_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "SizeInventory"
  FOR EACH ROW EXECUTE FUNCTION notify_inventory_change();

DROP TRIGGER IF EXISTS hold_notify_trigger ON "Hold";
CREATE TRIGGER hold_notify_trigger
  AFTER INSERT OR UPDATE OR DELETE ON "Hold"
  FOR EACH ROW EXECUTE FUNCTION notify_hold_change();
