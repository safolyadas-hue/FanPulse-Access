import { useState } from 'react'

export default function DestinationSearch({ locations, currentLocation, destination, onDestinationChange, onLocationChange }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Filter locations based on search term
  const filteredLocations = locations.filter(loc =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedLocName = destination ? locations.find(l => l.id === destination)?.name : ''

  const [isStartDropdownOpen, setIsStartDropdownOpen] = useState(false)

  const selectedStartLocName = currentLocation ? locations.find(l => l.id === currentLocation)?.name : 'Select a starting point'

  return (
    <div className="glass-card rounded-2xl p-lg flex flex-col gap-md relative z-20">
      <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">explore</span>
        Where would you like to go?
      </h3>

      <div className="flex flex-col gap-sm relative">
        <label className="text-sm font-semibold text-on-surface-variant">Starting Point</label>
        <button 
          onClick={() => setIsStartDropdownOpen(!isStartDropdownOpen)}
          onBlur={() => setTimeout(() => setIsStartDropdownOpen(false), 200)}
          className="bg-surface-container rounded-xl px-md py-sm border border-white/10 flex items-center justify-between gap-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer w-full text-left"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">my_location</span>
            <span className="text-on-surface font-medium">{selectedStartLocName}</span>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant pointer-events-none">arrow_drop_down</span>
        </button>

        {isStartDropdownOpen && (
          <div className="absolute top-full left-0 w-full mt-2 max-h-[300px] overflow-y-auto bg-surface-container-high border border-white/10 rounded-xl shadow-2xl p-2 z-50">
            {locations.map(loc => (
              <button
                key={`start-${loc.id}`}
                onClick={() => {
                  onLocationChange(loc.id)
                  setIsStartDropdownOpen(false)
                }}
                className="w-full text-left rounded-md px-3 py-2 my-0.5 hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="font-medium text-on-surface">{loc.name}</span>
                <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">{loc.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-sm relative">
        <label className="text-sm font-semibold text-on-surface-variant">Destination</label>
        <div
          className="bg-surface-container rounded-xl px-md py-xs border border-white/10 flex items-center gap-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all"
        >
          <span className="material-symbols-outlined text-error">location_on</span>
          <input
            type="text"
            placeholder="Search for a section, gate, restroom..."
            value={isDropdownOpen ? searchTerm : (selectedLocName || searchTerm)}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setIsDropdownOpen(true)
            }}
            onFocus={() => {
              setSearchTerm('')
              setIsDropdownOpen(true)
            }}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            className="bg-transparent border-none focus:outline-none text-on-surface w-full h-10 min-h-[44px]"
            aria-label="Search Destination"
          />
        </div>

        {/* Dropdown Results */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-64 overflow-y-auto glass-card rounded-xl border border-white/10 shadow-xl z-50">
            {filteredLocations.length > 0 ? (
              filteredLocations.map(loc => (
                <button
                  key={`dest-${loc.id}`}
                  onClick={() => {
                    onDestinationChange(loc.id)
                    setSearchTerm('')
                    setIsDropdownOpen(false)
                  }}
                  className="w-full text-left px-md py-sm hover:bg-white/5 border-b border-white/5 last:border-b-0 flex items-center justify-between cursor-pointer"
                >
                  <span className="font-medium text-on-surface">{loc.name}</span>
                  <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">{loc.type}</span>
                </button>
              ))
            ) : (
              <div className="px-md py-sm text-on-surface-variant text-center">No locations found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
