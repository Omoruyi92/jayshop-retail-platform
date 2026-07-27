import { storeLocations } from "@/lib/data/storeLocations";

export default function GameDayGuidePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-center mb-12">
        <div className="flex-grow h-px bg-jays-steel/30"></div>
        <h1 className="mx-6 text-3xl md:text-4xl text-center">
          <span className="italic text-jays-navy font-serif">Jays Shop</span>
          <br className="md:hidden" />
          <span className="font-bold text-jays-navy ml-2">Store Locations and Hours</span>
        </h1>
        <div className="flex-grow h-px bg-jays-steel/30"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {storeLocations.map((loc, i) => (
          <div key={i} className="border border-jays-ice bg-gray-50/50 p-6 flex flex-col">
            <h3 className="text-xl mb-4">
              <span className="italic font-bold">{loc.name}</span>
              <span className="italic">{loc.venue}</span>
            </h3>
            
            <div className="mb-4">
              {loc.addressLines.map((line, idx) => (
                <p key={idx} className="text-gray-700">{line}</p>
              ))}
            </div>
            
            {loc.phone && (
              <p className="mb-4 text-gray-700">
                <span className="font-bold">Phone:</span> <a href={`tel:${loc.phone.replace(/\D/g,'')}`} className="text-jays-navy hover:underline">{loc.phone}</a>
              </p>
            )}
            
            <div className="mb-4 flex-grow">
              {Array.isArray(loc.hours) ? loc.hours.map((h, idx) => (
                <p key={idx} className="text-gray-700">{h}</p>
              )) : <p className="text-gray-700">{loc.hours}</p>}
            </div>
            
            {loc.note && (
              <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-jays-ice/50">{loc.note}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
