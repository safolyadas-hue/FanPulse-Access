import { useEffect } from 'react'
import { useWayfinding } from '../../hooks/useWayfinding.js'
import { useSpeech } from '../../hooks/useSpeech.js'
import DestinationSearch from './DestinationSearch.jsx'
import RouteOverview from './RouteOverview.jsx'
import StepByStepGuide from './StepByStepGuide.jsx'

export default function WayfindingPanel() {
  const {
    currentLocation,
    setCurrentLocation,
    destination,
    setDestination,
    activeRoute,
    searchableLocations,
  } = useWayfinding()
  
  const { cancel } = useSpeech()

  // Cancel any ongoing speech when unmounting or leaving the view
  useEffect(() => {
    return () => cancel()
  }, [cancel])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 animate-in fade-in zoom-in-95 duration-300">
      <header className="flex flex-col gap-xs mb-lg z-10 relative">
        <h2 className="text-on-surface font-extrabold" style={{ fontSize: '36px', lineHeight: '1.1' }}>
          Wayfinding
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          Get step-by-step, profile-adapted directions to any stadium location.
        </p>
      </header>

      <div className="flex-1 overflow-y-auto pb-xl pr-2 custom-scrollbar">
        <DestinationSearch 
          locations={searchableLocations}
          currentLocation={currentLocation}
          destination={destination}
          onLocationChange={setCurrentLocation}
          onDestinationChange={setDestination}
        />

        {destination && !activeRoute && (
          <div className="mt-8 text-center text-on-surface-variant">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Calculating best route...</p>
          </div>
        )}

        {activeRoute && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <RouteOverview route={activeRoute} />
            <StepByStepGuide steps={activeRoute.steps} />
          </div>
        )}
      </div>
    </div>
  )
}
