import { useState, useMemo } from 'react'
import { useProfile } from './useProfile.js'
import { findRoute } from '../services/routingEngine.js'
import stadiumData from '../data/stadium.json'

export function useWayfinding() {
  const { profileId } = useProfile()
  
  // Default to Gate A for demo purposes
  const [currentLocation, setCurrentLocation] = useState('gate-a')
  const [destination, setDestination] = useState(null)

  const activeRoute = useMemo(() => {
    if (!currentLocation || !destination) return null
    return findRoute(currentLocation, destination, profileId, stadiumData)
  }, [currentLocation, destination, profileId])

  // Extract all searchable locations for the dropdown
  const searchableLocations = useMemo(() => {
    const locations = []
    
    if (stadiumData.sections) {
      stadiumData.sections.forEach(s => locations.push({ id: s.id, name: s.name, type: 'Section' }))
    }
    if (stadiumData.gates) {
      stadiumData.gates.forEach(g => locations.push({ id: g.id, name: g.name, type: 'Gate' }))
    }
    if (stadiumData.restrooms) {
      stadiumData.restrooms.forEach(r => locations.push({ id: r.id, name: r.name, type: 'Restroom' }))
    }
    if (stadiumData.quiet_spaces) {
      stadiumData.quiet_spaces.forEach(q => locations.push({ id: q.id, name: q.name, type: 'Sensory Room' }))
    }
    if (stadiumData.concessions) {
      stadiumData.concessions.forEach(c => locations.push({ id: c.id, name: c.name, type: 'Concession' }))
    }
    
    return locations.sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  return {
    currentLocation,
    setCurrentLocation,
    destination,
    setDestination,
    activeRoute,
    searchableLocations,
  }
}
