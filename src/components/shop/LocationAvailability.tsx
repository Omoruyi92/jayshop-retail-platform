import { MapPin, Store, Package } from 'lucide-react'

type SizeAvailability = {
  size: string
  quantity: number
  status: 'in-stock' | 'low' | 'out'
}

type LocationAvailability = {
  locationId: string
  name: string
  section: string | null
  gate: string | null
  isPickupQueue: boolean
  isMainStore: boolean
  sizes: SizeAvailability[]
}

const STATUS_STYLES: Record<SizeAvailability['status'], { pill: string; dot: string }> = {
  'in-stock': { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  low:        { pill: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  out:        { pill: 'bg-red-50 text-red-600 border-red-200',             dot: 'bg-red-500' },
}

const STATUS_LABEL: Record<SizeAvailability['status'], string> = {
  'in-stock': 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
}

export default function LocationAvailability({ locations }: { locations: LocationAvailability[] }) {
  if (locations.length === 0) return null

  return (
    <div className="mt-6">
      {/* Banner header */}
      <div className="relative bg-gradient-to-r from-jays-navy via-jays-royal to-jays-navy rounded-t-2xl px-5 py-3 overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1.5' fill='white'/%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px',
        }} />
        <div className="relative flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-sm">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white uppercase text-sm tracking-wide">
              Available At
            </h3>
            <p className="text-[10px] text-white/60 font-medium">{locations.length} locations</p>
          </div>
        </div>
      </div>

      {/* Location cards */}
      <div className="border border-t-0 border-gray-100 rounded-b-2xl bg-gradient-to-b from-white to-jays-ice/30 divide-y divide-gray-100 overflow-hidden">
        {locations.map((loc) => {
          const allOos = loc.sizes.length > 0 && loc.sizes.every((s) => s.status === 'out')
          const inStockCount = loc.sizes.filter(s => s.status === 'in-stock').length
          const lowCount = loc.sizes.filter(s => s.status === 'low').length

          return (
            <div key={loc.locationId} className="px-4 py-3 hover:bg-jays-ice/20 transition-colors">
              {/* Location header */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    loc.isMainStore ? 'bg-jays-navy/10' : loc.isPickupQueue ? 'bg-blue-50' : 'bg-gray-100'
                  }`}>
                    {loc.isPickupQueue ? (
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Store className="w-3.5 h-3.5 text-jays-navy" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-jays-navy">{loc.name}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {loc.isMainStore && (
                        <span className="px-2 py-0.5 rounded-full bg-jays-navy text-white text-[9px] font-bold uppercase tracking-wider">
                          Main Store
                        </span>
                      )}
                      {loc.isPickupQueue && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider">
                          Pickup Queue
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick summary badges */}
                {!allOos && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {inStockCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {inStockCount}
                      </span>
                    )}
                    {lowCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {lowCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Size availability */}
              {allOos ? (
                <div className="flex items-center gap-1.5 ml-9 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-red-600 font-semibold">Currently sold out at this location</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 ml-9">
                  {loc.sizes.map((s) => {
                    const style = STATUS_STYLES[s.status]
                    return (
                      <span
                        key={s.size}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${style.pill} transition-transform hover:scale-105`}
                        title={`${s.size}: ${s.quantity} ${STATUS_LABEL[s.status]}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
                        <span className="font-bold">{s.size}</span>
                        <span className="opacity-50">·</span>
                        <span>{s.quantity}</span>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
