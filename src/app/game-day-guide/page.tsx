import { storeLocations } from "@/lib/data/storeLocations";

export default function GameDayGuidePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">
      
      {/* ── Section 1: Store Locations and Hours ── */}
      <section>
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
                <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-jays-ice/50 font-normal">{loc.note}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 2: Rogers Centre Visitor Information ── */}
      <section>
        <div className="flex items-center justify-center mb-12">
          <div className="flex-grow h-px bg-jays-steel/30"></div>
          <h2 className="mx-6 text-3xl md:text-4xl text-center">
            <span className="italic text-jays-navy font-serif">Rogers Centre</span>
            <br className="md:hidden" />
            <span className="font-bold text-jays-navy ml-2">Visitor Information</span>
          </h2>
          <div className="flex-grow h-px bg-jays-steel/30"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-jays-ice bg-gray-50/50 p-6">
            <h3 className="text-lg font-bold text-jays-navy mb-2">Gate Locations & Jays Shops</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li><strong>Gate 1:</strong> Primary Jays Shop location, accessible from outside the stadium.</li>
              <li><strong>Gate 5:</strong> Secondary location with stadium access.</li>
              <li><strong>Gate 8:</strong> Kiosk and select apparel.</li>
            </ul>
          </div>
          
          <div className="border border-jays-ice bg-gray-50/50 p-6">
            <h3 className="text-lg font-bold text-jays-navy mb-2">Gate Opening Times</h3>
            <p className="text-gray-700 mb-2">
              Gates typically open <strong>90 minutes</strong> prior to the scheduled first pitch on weekdays, and <strong>2 hours</strong> prior on weekends.
            </p>
            <p className="text-gray-700 text-sm">Arrive early on giveaway days as items are distributed on a first-come, first-served basis.</p>
          </div>

          <div className="border border-jays-ice bg-gray-50/50 p-6">
            <h3 className="text-lg font-bold text-jays-navy mb-2">Bag Policy</h3>
            <p className="text-gray-700 mb-2">
              Rogers Centre enforces a strict bag policy to ensure fan safety and expedite entry:
            </p>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Clear bags smaller than 12&quot; x 6&quot; x 12&quot; are permitted.</li>
              <li>Small clutch purses (no larger than 4.5&quot; x 6.5&quot;) are allowed.</li>
              <li>No backpacks or oversized bags.</li>
            </ul>
          </div>

          <div className="border border-jays-ice bg-gray-50/50 p-6">
            <h3 className="text-lg font-bold text-jays-navy mb-2">Transit & Parking</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li><strong>Union Station:</strong> A 10-minute walk via the SkyWalk or Bremner Blvd. Connects to TTC, GO Transit, and UP Express.</li>
              <li><strong>Parking:</strong> Limited underground parking is available. Fans are strongly encouraged to use public transit.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Section 3: Game-Day Shopping Experience ── */}
      <section>
        <div className="flex items-center justify-center mb-12">
          <div className="flex-grow h-px bg-jays-steel/30"></div>
          <h2 className="mx-6 text-3xl md:text-4xl text-center">
            <span className="italic text-jays-navy font-serif">Game Day</span>
            <br className="md:hidden" />
            <span className="font-bold text-jays-navy ml-2">Shopping Experience</span>
          </h2>
          <div className="flex-grow h-px bg-jays-steel/30"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-jays-ice bg-gray-50/50 p-6">
            <h3 className="text-lg font-bold text-jays-navy mb-2">What&apos;s Different on Game Days?</h3>
            <p className="text-gray-700">
              On game days, the Gate 1 and Gate 5 shops transition to serve ticketed guests. 
              Non-ticketed fans should visit the shops prior to gate opening — typically 90 minutes before first pitch on weekdays and 2 hours on weekends. 
              Additional kiosks open throughout the concourse levels.
            </p>
          </div>

          <div className="border border-jays-ice bg-gray-50/50 p-6">
            <h3 className="text-lg font-bold text-jays-navy mb-2">In-Store & Hold-Tag Pickup</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li><strong>In-Store Pickup:</strong> Orders placed online can be picked up at the designated Gate 5 counter.</li>
              <li><strong>Hold-Tag Flow:</strong> If you reserved an item using our Hold system, present your hold confirmation at the express checkout lane at Sec123 or Gate 5 to finalize your purchase.</li>
            </ul>
          </div>

          <div className="border border-jays-ice bg-gray-50/50 p-6 md:col-span-2">
            <h3 className="text-lg font-bold text-jays-navy mb-2">Tips to Beat the Line</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-4 rounded border border-jays-steel/20">
                <strong className="text-jays-navy block mb-1">Arrive Early</strong>
                <p className="text-sm text-gray-600">The busiest times are 30-45 minutes before first pitch and immediately after the final out.</p>
              </div>
              <div className="bg-white p-4 rounded border border-jays-steel/20">
                <strong className="text-jays-navy block mb-1">Use the Hold System</strong>
                <p className="text-sm text-gray-600">Reserve your size online before you arrive and skip the browsing crowd.</p>
              </div>
              <div className="bg-white p-4 rounded border border-jays-steel/20">
                <strong className="text-jays-navy block mb-1">Check the Concourse</strong>
                <p className="text-sm text-gray-600">If Gate 1 is packed, check the 100-level and 200-level kiosks for popular items like hats and jerseys.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
