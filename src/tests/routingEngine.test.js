import { describe, it, expect } from 'vitest'
import {
  findRoute,
  findNearestAlternative,
  findQuietSpaces,
  getOutOfServiceFacilities,
} from '../services/routingEngine.js'

// Minimal stadium data fixture — deliberately small and fully coordinate-based
// so distance/time calculations are deterministic and easy to reason about.
function buildStadiumData() {
  return {
    gates: [
      { id: 'gate-a', name: 'Gate A', coordinates: { x: 0, y: 0 } },
      { id: 'gate-b', name: 'Gate B', coordinates: { x: 100, y: 0 } },
    ],
    sections: [
      {
        id: 'sec-101',
        name: 'Section 101',
        level: 'lower',
        zone: 'east',
        accessible_seating: true,
        coordinates: { x: 10, y: 0 },
      },
    ],
    elevators: [
      { id: 'elev-1', name: 'Elevator 1', zone: 'east', in_service: true },
      { id: 'elev-2', name: 'Elevator 2', zone: 'east', in_service: false },
    ],
    ramps: [],
    restrooms: [],
    quiet_spaces: [
      { id: 'quiet-1', name: 'Sensory Room A', coordinates: { x: 5, y: 5 }, level: 'lower', zone: 'east', capacity: 4, noise_level: 'low', features: [], nearest_gate: 'gate-a' },
      { id: 'quiet-2', name: 'Sensory Room B', coordinates: { x: 50, y: 50 }, level: 'lower', zone: 'west', capacity: 4, noise_level: 'low', features: [], nearest_gate: 'gate-b' },
    ],
    concessions: [],
    routes: [
      {
        id: 'route-standard',
        from: 'gate-a',
        to: 'sec-101',
        step_free: true,
        total_distance_meters: 50,
        estimated_minutes: 2,
        steps: [
          { instruction: 'Enter through Gate A', distance_meters: 0, step_free: true, noise_exposure: 'low' },
          { instruction: 'Walk to Section 101', distance_meters: 50, step_free: true, noise_exposure: 'low' },
        ],
      },
      {
        id: 'route-stairs',
        from: 'gate-a',
        to: 'sec-101',
        step_free: false,
        total_distance_meters: 40,
        estimated_minutes: 2,
        steps: [
          { instruction: 'Take stairs to Section 101', distance_meters: 40, step_free: false, noise_exposure: 'low' },
        ],
      },
      {
        id: 'route-oos-dependent',
        from: 'gate-b',
        to: 'sec-101',
        step_free: true,
        total_distance_meters: 20,
        estimated_minutes: 1,
        steps: [
          { instruction: 'Take Elevator 2 to Section 101', distance_meters: 20, step_free: true, noise_exposure: 'low', requires: 'elev-2' },
        ],
      },
    ],
  }
}

describe('findRoute', () => {
  it('returns a viable curated route between two known locations', () => {
    const data = buildStadiumData()
    const result = findRoute('gate-a', 'sec-101', 'standard', data)
    expect(result.routeId).toBeTruthy()
    expect(result.steps.length).toBeGreaterThan(0)
    expect(result.totalDistance).toMatch(/^\d+m$/)
    expect(result.estimatedMinutes).toBeGreaterThan(0)
  })

  it('excludes non-step-free routes for the Mobility profile', () => {
    const data = buildStadiumData()
    const result = findRoute('gate-a', 'sec-101', 'mobility', data)
    expect(result.routeId).toBe('route-standard')
    expect(result.steps.every((s) => s.stepFree)).toBe(true)
  })

  it('filters out routes that depend on an out-of-service facility', () => {
    const data = buildStadiumData()
    const result = findRoute('gate-b', 'sec-101', 'standard', data)
    // The only route from gate-b to sec-101 requires elev-2, which is out of service
    expect(result.routeId).toBeNull()
    expect(result.steps).toEqual([])
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('generates a synthetic fallback route when no curated route exists', () => {
    const data = buildStadiumData()
    const result = findRoute('gate-b', 'gate-a', 'standard', data)
    expect(result.routeId).toMatch(/^route-synthetic-/)
    expect(result.steps.length).toBe(3)
    expect(result.totalDistance).toMatch(/^\d+m$/)
  })

  it('recalculates distance dynamically from coordinates rather than trusting stored values', () => {
    const data = buildStadiumData()
    const result = findRoute('gate-a', 'sec-101', 'mobility', data)
    // Euclidean distance gate-a(0,0) -> sec-101(10,0) = 10 units * 3m/unit = 30m
    expect(result.totalDistance).toBe('30m')
  })
})

describe('findNearestAlternative', () => {
  it('finds the nearest in-service elevator from a location', () => {
    const data = buildStadiumData()
    const result = findNearestAlternative('gate-a', 'elevator', data)
    expect(result).not.toBeNull()
    expect(result.facility.id).toBe('elev-1') // elev-2 is out of service, excluded
  })

  it('returns null for an unrecognized facility type', () => {
    const data = buildStadiumData()
    const result = findNearestAlternative('gate-a', 'not_a_real_type', data)
    expect(result).toBeNull()
  })
})

describe('findQuietSpaces', () => {
  it('sorts quiet spaces by distance from the current location, nearest first', () => {
    const data = buildStadiumData()
    const result = findQuietSpaces('gate-a', data)
    expect(result[0].id).toBe('quiet-1')
    expect(result[1].id).toBe('quiet-2')
    expect(result[0].distance).toBeLessThan(result[1].distance)
  })
})

describe('getOutOfServiceFacilities', () => {
  it('returns only facilities currently marked out of service', () => {
    const data = buildStadiumData()
    const result = getOutOfServiceFacilities(data)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('elev-2')
    expect(result[0].type).toBe('elevator')
  })
})
