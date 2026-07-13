'use client'

import { useState } from 'react'
import { MapPin, X } from 'lucide-react'
import type { LocationInventory } from './StadiumAvailability'

interface Props {
  locations: (LocationInventory & { status: string; matchText: string; availableCount: number })[]
  selectedSize: string | null
  recommendedId?: string
}

export default function StadiumMap({ locations, selectedSize, recommendedId }: Props) {
  const [selectedLoc, setSelectedLoc] = useState<typeof locations[0] | null>(null)

  // A very simplified SVG representation of a stadium (baseball diamond & stands)
  return (
    <div className="relative mt-6 border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
      <div className="p-3 bg-white border-b border-gray-200">
        <h4 className="font-display font-semibold text-sm text-jays-navy uppercase">Stadium Map</h4>
      </div>
      
      <div className="relative aspect-[4/3] md:aspect-[16/9] w-full bg-[#e8f1f5]">
        <svg viewBox="0 0 800 600" className="w-full h-full opacity-60">
          {/* Outfield Wall */}
          <path d="M 100 300 Q 400 50 700 300" fill="none" stroke="#A0C4E2" strokeWidth="8" strokeDasharray="10 10" />
          {/* Diamond */}
          <path d="M 400 450 L 300 350 L 400 250 L 500 350 Z" fill="#fff" stroke="#A0C4E2" strokeWidth="4" />
          {/* Bases */}
          <rect x="390" y="440" width="20" height="20" fill="#A0C4E2" transform="rotate(45 400 450)" />
          <rect x="490" y="340" width="20" height="20" fill="#A0C4E2" transform="rotate(45 500 350)" />
          <rect x="390" y="240" width="20" height="20" fill="#A0C4E2" transform="rotate(45 400 250)" />
          <rect x="290" y="340" width="20" height="20" fill="#A0C4E2" transform="rotate(45 300 350)" />
          {/* Pitcher Mound */}
          <circle cx="400" cy="350" r="15" fill="#A0C4E2" />
        </svg>

        {/* Store Markers - Spread them out somewhat realistically */}
        {locations.map((loc, i) => {
          // Calculate pseudo-random positions based on code just for demo purposes
          const angle = (i / locations.length) * Math.PI + Math.PI; // Upper half circle
          const radius = loc.isMainStore ? 280 : 200 + (Math.sin(i) * 50);
          const cx = 400 + Math.cos(angle) * radius;
          const cy = 400 + Math.sin(angle) * radius * 0.7; // Flatten oval

          const isRecommended = loc.id === recommendedId
          const isSelected = selectedLoc?.id === loc.id
          
          let markerColor = 'bg-gray-300 text-gray-500' // Out of stock
          if (loc.status === 'IN_STOCK') markerColor = 'bg-green-500 text-white'
          else if (loc.status === 'LOW_STOCK') markerColor = 'bg-amber-500 text-white'

          if (isRecommended) markerColor = 'bg-jays-red text-white shadow-[0_0_0_4px_rgba(232,41,28,0.2)]'

          return (
            <button
              key={loc.id}
              onClick={() => setSelectedLoc(loc)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'}`}
              style={{ left: `${(cx / 800) * 100}%`, top: `${(cy / 600) * 100}%` }}
              aria-label={loc.name}
            >
              <div className={`p-1.5 rounded-full shadow-md flex items-center justify-center ${markerColor}`}>
                <MapPin size={16} fill="currentColor" stroke="white" />
              </div>
            </button>
          )
        })}

        {/* Selected Store Info Overlay */}
        {selectedLoc && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-30 animate-in fade-in slide-in-from-bottom-4">
            <button 
              onClick={() => setSelectedLoc(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <h5 className="font-semibold text-gray-900 pr-6">{selectedLoc.name}</h5>
            {selectedLoc.isMainStore && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-jays-navy text-white text-[10px] uppercase font-bold rounded-sm tracking-wider">Main Store</span>
            )}
            
            <div className="mt-3 text-sm">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-500">Inventory Status</span>
                <span className={`font-medium ${
                  selectedLoc.status === 'IN_STOCK' ? 'text-green-600' : 
                  selectedLoc.status === 'LOW_STOCK' ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {selectedLoc.matchText}
                </span>
              </div>
              
              {!selectedSize && selectedLoc.totalAvailable > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  <span className="block mb-1">Available Sizes:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedLoc.sizes.filter(s => s.available > 0).map(s => (
                      <span key={s.size} className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200">{s.size}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button className="mt-4 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold uppercase tracking-wide rounded-lg transition-colors">
              Get Directions
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
