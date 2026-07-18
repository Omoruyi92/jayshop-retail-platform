'use client'

import { useState } from 'react'
import { MapPin, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, XCircle, Map } from 'lucide-react'
import StadiumMap from './StadiumMap'

export interface LocationInventory {
  id: string
  name: string
  code: string
  isMainStore: boolean
  sizes: {
    size: string
    available: number
  }[]
  totalAvailable: number
}

interface Props {
  locations: LocationInventory[]
  selectedSize: string | null
}

export default function StadiumAvailability({ locations, selectedSize }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [showMap, setShowMap] = useState(false)
  
  if (locations.length === 0) return null

  // Filter and sort locations based on selected size
  const relevantLocations = locations.map(loc => {
    let status = 'OUT_OF_STOCK'
    let availableCount = 0
    let matchText = 'Out of Stock'

    if (selectedSize) {
      const sizeData = loc.sizes.find(s => s.size === selectedSize)
      availableCount = sizeData?.available || 0
    } else {
      availableCount = loc.totalAvailable
    }

    if (availableCount > 5) {
      status = 'IN_STOCK'
      matchText = 'In Stock'
    } else if (availableCount > 0) {
      status = 'LOW_STOCK'
      matchText = `Low Stock (${availableCount} left)`
    }

    return {
      ...loc,
      status,
      matchText,
      availableCount
    }
  }).sort((a, b) => {
    if (a.availableCount > 0 && b.availableCount === 0) return -1
    if (a.availableCount === 0 && b.availableCount > 0) return 1
    if (a.isMainStore && !b.isMainStore) return -1
    if (!a.isMainStore && b.isMainStore) return 1
    return b.availableCount - a.availableCount
  })

  const hasAnyAvailable = relevantLocations.some(l => l.availableCount > 0)
  const topLocation = relevantLocations[0]

  return (
    <div className="mt-8 border border-gray-200 rounded-2xl overflow-hidden bg-white">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="bg-jays-ice p-2 rounded-full text-jays-navy">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-jays-navy uppercase leading-tight">
              Available Around the Stadium
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {selectedSize 
                ? (hasAnyAvailable ? `Size ${selectedSize} available at ${relevantLocations.filter(l => l.availableCount > 0).length} locations` : `Size ${selectedSize} is out of stock in stadium`)
                : 'Select a size to check stadium locations'}
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-1.5 text-xs font-semibold text-jays-navy bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors uppercase tracking-wider"
            >
              <Map size={14} />
              {showMap ? 'Hide Map' : 'View Map'}
            </button>
          </div>

          {showMap && <StadiumMap locations={relevantLocations} selectedSize={selectedSize} recommendedId={topLocation?.id} />}

          {/* Recommended Location */}

          {selectedSize && hasAnyAvailable && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">Recommended Location</p>
                <p className="text-sm text-green-700">{topLocation.name}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {relevantLocations.map(loc => {
              // only show out of stock if we aren't filtering to a size, OR if we are filtering but want to show it's unavailable here
              if (!selectedSize && loc.totalAvailable === 0) return null
              
              return (
                <div key={loc.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                  <div>
                    <p className="font-medium text-gray-900 text-sm flex items-center gap-2">
                      {loc.name}
                      {loc.isMainStore && <span className="px-2 py-0.5 bg-jays-navy text-white text-[10px] uppercase font-bold rounded-sm tracking-wider">Main Store</span>}
                    </p>
                    {/* Show available sizes preview if no size selected */}
                    {!selectedSize && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sizes: {(loc.sizes ?? []).filter(s => s.available > 0).map(s => s.size).join(', ') || 'None'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {loc.status === 'IN_STOCK' && <CheckCircle2 size={16} className="text-green-500" />}
                    {loc.status === 'LOW_STOCK' && <AlertCircle size={16} className="text-amber-500" />}
                    {loc.status === 'OUT_OF_STOCK' && <XCircle size={16} className="text-gray-300" />}
                    <span className={`text-xs font-medium ${
                      loc.status === 'IN_STOCK' ? 'text-green-600' : 
                      loc.status === 'LOW_STOCK' ? 'text-amber-600' : 'text-gray-400'
                    }`}>
                      {loc.matchText}
                    </span>
                  </div>
                </div>
              )
            })}
            
            {relevantLocations.filter(l => selectedSize ? l.availableCount > 0 : l.totalAvailable > 0).length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                No inventory available across stadium locations.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
