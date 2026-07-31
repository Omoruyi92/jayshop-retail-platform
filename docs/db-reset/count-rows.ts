/**
 * READ-ONLY row-count helper for the history-purge audit.
 *
 * Connects with the raw `pg` driver (not Prisma) and wraps every query in an
 * explicit `BEGIN READ ONLY` transaction, so Postgres itself rejects any
 * accidental write — this script cannot mutate data even if edited carelessly.
 *
 * Usage:
 *   DATABASE_URL="postgres://...neon..." npx tsx docs/db-reset/count-rows.ts
 *   (or just `npx tsx docs/db-reset/count-rows.ts` to use the .env in cwd)
 *
 * Does NOT print the connection string. Only prints table names and counts.
 */
import { Client } from 'pg'

const TABLES: { label: string; sql: string }[] = [
  // Tier A candidates
  { label: 'Hold (all statuses)', sql: `SELECT count(*) FROM "Hold"` },
  { label: 'Hold (ACTIVE)', sql: `SELECT count(*) FROM "Hold" WHERE status = 'ACTIVE'` },
  { label: 'Hold (EXPIRED)', sql: `SELECT count(*) FROM "Hold" WHERE status = 'EXPIRED'` },
  { label: 'Hold (PICKED_UP)', sql: `SELECT count(*) FROM "Hold" WHERE status = 'PICKED_UP'` },
  { label: 'Hold (RELEASED)', sql: `SELECT count(*) FROM "Hold" WHERE status = 'RELEASED'` },
  { label: 'HoldHistory', sql: `SELECT count(*) FROM "HoldHistory"` },
  { label: 'SalesHistory', sql: `SELECT count(*) FROM "SalesHistory"` },
  { label: 'InventoryTransaction', sql: `SELECT count(*) FROM "InventoryTransaction"` },
  { label: 'PosEvent', sql: `SELECT count(*) FROM "PosEvent"` },
  // Tier B candidates
  { label: 'AuditLog', sql: `SELECT count(*) FROM "AuditLog"` },
  { label: 'ProductReview', sql: `SELECT count(*) FROM "ProductReview"` },
  { label: 'ProductLike', sql: `SELECT count(*) FROM "ProductLike"` },
  // Sanity checks — must be UNCHANGED by any purge
  { label: 'Product', sql: `SELECT count(*) FROM "Product"` },
  { label: 'SizeInventory', sql: `SELECT count(*) FROM "SizeInventory"` },
  { label: 'Customer', sql: `SELECT count(*) FROM "Customer"` },
  { label: 'Product (sum quantity)', sql: `SELECT coalesce(sum(quantity),0) FROM "Product"` },
  { label: 'Product (sum heldQuantity)', sql: `SELECT coalesce(sum("heldQuantity"),0) FROM "Product"` },
  { label: 'Product (sum pickedQuantity)', sql: `SELECT coalesce(sum("pickedQuantity"),0) FROM "Product"` },
  { label: 'SizeInventory (sum quantity)', sql: `SELECT coalesce(sum(quantity),0) FROM "SizeInventory"` },
  { label: 'SizeInventory (sum heldQuantity)', sql: `SELECT coalesce(sum("heldQuantity"),0) FROM "SizeInventory"` },
  { label: 'SizeInventory (sum pickedQuantity)', sql: `SELECT coalesce(sum("pickedQuantity"),0) FROM "SizeInventory"` },
]

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL is not set in the environment.')
    process.exit(1)
  }
  let host = '(unparseable)'
  try { host = new URL(url).hostname } catch {}
  console.log(`Connecting to host: ${host} (value never printed)`)

  const client = new Client({ connectionString: url })
  await client.connect()
  try {
    await client.query('BEGIN TRANSACTION READ ONLY')
    console.log('\n' + 'TABLE'.padEnd(32) + 'COUNT')
    for (const { label, sql } of TABLES) {
      const res = await client.query(sql)
      const val = Object.values(res.rows[0])[0]
      console.log(label.padEnd(32), val)
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Query failed (rolled back, nothing was written):', err)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
