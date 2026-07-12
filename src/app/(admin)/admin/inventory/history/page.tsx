import { InventoryHistoryTable } from '@/components/admin/InventoryHistoryTable'

export default function InventoryHistoryPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase text-jays-navy">Inventory History</h1>
          <p className="text-jays-steel text-sm mt-1">Append-only audit log of every inventory transfer, adjustment, assignment, and hold movement</p>
        </div>
      </div>

      <InventoryHistoryTable />
    </div>
  )
}
