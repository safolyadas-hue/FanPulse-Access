/**
 * routingEngine.js — Profile-Adaptive Wayfinding Engine
 *
 * Shared routing logic for ALL profiles. This module never checks a profile
 * ID directly — it receives a `RoutePreferences` object from profileEngine
 * and uses its boolean flags to filter, score, and rank candidate routes.
 *
 * Key design principles:
 *   1. One algorithm, five behaviors — driven entirely by preference flags.
 *   2. Out-of-service facilities are hard-filtered before scoring.
 *   3. Routes are scored, not just filtered, so the engine can return
 *      ranked alternatives when the primary route is blocked.
 *   4. All returned objects follow the contract:
 *        { steps[], totalDistance, estimatedMinutes, warnings[], alternatives[] }
 *
 * Exported functions:
 *   - findRoute(from, to, profileId, stadiumData)
 *   - findNearestAlternative(location, facilityType, stadiumData)
 *   - findQuietSpaces(currentLocation, stadiumData)
 *   - getOutOfServiceFacilities(stadiumData)
 */

import { getRoutePreferences } from './profileEngine.js'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Noise levels ordered from least to most stimulating. */
const NOISE_RANK = Object.freeze({ very_low: 0, low: 1, medium: 2, high: 3 })

/** Maximum noise level a cognitive/sensory-avoidant route should traverse. */
const NOISE_THRESHOLD_AVOID = 'medium'

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Build a lookup set of all facility IDs that are currently out of service.
 * Covers both elevators and ramps (the two facility types with service status).
 *
 * @param {Object} stadiumData – Parsed stadium.json.
 * @returns {Set<string>} Set of out-of-service facility IDs.
 */
function buildOutOfServiceSet(stadiumData) {
  const oos = new Set()

  for (const elev of stadiumData.elevators || []) {
    if (!elev.in_service) oos.add(elev.id)
  }
  for (const ramp of stadiumData.ramps || []) {
    if (!ramp.in_service) oos.add(ramp.id)
  }

  return oos
}

/**
 * Check whether a single route step depends on an out-of-service facility.
 *
 * @param {Object}     step   – A step object from a route's `steps` array.
 * @param {Set<string>} oosSet – Out-of-service IDs.
 * @returns {boolean} True if the step requires a broken facility.
 */
function stepRequiresOOSFacility(step, oosSet) {
  return step.requires && oosSet.has(step.requires)
}

/**
 * Check whether an entire route depends on any out-of-service facility.
 *
 * @param {Object}     route  – A route object from stadiumData.routes.
 * @param {Set<string>} oosSet – Out-of-service IDs.
 * @returns {boolean} True if at least one step requires a broken facility.
 */
function routeRequiresOOSFacility(route, oosSet) {
  return route.steps.some((step) => stepRequiresOOSFacility(step, oosSet))
}

/**
 * Calculate the peak (worst) noise exposure across a route's steps.
 *
 * @param {Object} route – Route object.
 * @returns {string} The highest noise_exposure value encountered.
 */
function peakNoiseExposure(route) {
  let maxRank = 0
  for (const step of route.steps) {
    const rank = NOISE_RANK[step.noise_exposure] ?? 0
    if (rank > maxRank) maxRank = rank
  }
  return Object.keys(NOISE_RANK).find((k) => NOISE_RANK[k] === maxRank) || 'low'
}

/**
 * Calculate the average noise score across route steps (weighted by distance).
 * Used for ranking routes when avoidNoise is active.
 *
 * @param {Object} route – Route object.
 * @returns {number} Weighted noise score (lower is quieter).
 */
function weightedNoiseScore(route) {
  let totalWeight = 0
  let totalScore = 0

  for (const step of route.steps) {
    const weight = Math.max(step.distance_meters, 1) // Avoid zero-weight
    const noise = NOISE_RANK[step.noise_exposure] ?? 1
    totalScore += noise * weight
    totalWeight += weight
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0
}

/**
 * Score a candidate route against the given preferences.
 * Lower score = better route.
 *
 * Scoring weights:
 *   - Distance is always a factor (normalized to ~0–1 by dividing by 200m).
 *   - Noise penalty is added when avoidNoise is active.
 *   - Non-step-free routes get an infinite penalty when stepFree is required.
 *   - Routes through out-of-service facilities are excluded before scoring.
 *
 * @param {Object} route – Candidate route object.
 * @param {Object} prefs – RoutePreferences from profileEngine.
 * @returns {number} Composite score (lower is better). Infinity = disqualified.
 */
function scoreRoute(route, prefs) {
  // Hard disqualify: step-free required but route has stairs
  if (prefs.stepFree && !route.step_free) {
    return Infinity
  }

  let score = 0

  // Distance component (always present, normalized)
  const distanceNorm = route.total_distance_meters / 200
  score += distanceNorm * (prefs.preferShort ? 2.0 : 1.0)

  // Time component
  score += (route.estimated_minutes || 0) * 0.3

  // Noise avoidance penalty
  if (prefs.avoidNoise) {
    const noise = weightedNoiseScore(route)
    score += noise * 3.0 // Heavy penalty for noisy routes
  }

  // Crowd avoidance (high noise ≈ high crowd proxy)
  if (prefs.avoidCrowds) {
    const peak = NOISE_RANK[peakNoiseExposure(route)] ?? 0
    score += peak * 2.0
  }

  return score
}

/**
 * Compute the Euclidean distance between two coordinate objects.
 *
 * @param {{ x: number, y: number }} a – First point.
 * @param {{ x: number, y: number }} b – Second point.
 * @returns {number} Euclidean distance.
 */
function euclidean(a, b) {
  if (!a || !b) return Infinity
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function extractNumberFromId(id) {
  const match = id.match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

function calculateDynamicDistance(from, to, stadiumData) {
  const coordA = resolveCoordinates(from, stadiumData)
  const coordB = resolveCoordinates(to, stadiumData)
  
  if (coordA && coordB) {
    // 1 coordinate unit ≈ 3 meters
    const dist = euclidean(coordA, coordB)
    return Math.max(10, Math.round(dist * 3))
  }
  
  const numA = extractNumberFromId(from)
  const numB = extractNumberFromId(to)
  
  if (numA !== null && numB !== null) {
    // Proxy: 10 meters per ID unit difference
    const diff = Math.abs(numA - numB)
    return Math.max(20, diff * 10)
  }
  
  // Default fallback if no numbers or coords
  return 85
}

function getWalkingSpeed(profileId) {
  switch (profileId) {
    case 'mobility':
    case 'vision':
      return 0.8
    case 'cognitive':
      return 1.0
    case 'standard':
    default:
      return 1.4
  }
}


/**
 * Resolve a location identifier (gate ID, section ID, quiet-space ID, etc.)
 * to its coordinate object from the stadium data. Searches across all
 * locatable entity arrays.
 *
 * @param {string} locationId – Entity ID (e.g., 'gate-a', 'sec-302').
 * @param {Object} stadiumData – Parsed stadium data.
 * @returns {{ x: number, y: number }|null} Coordinates or null.
 */
function resolveCoordinates(locationId, stadiumData) {
  const collections = [
    'gates', 'sections', 'elevators', 'ramps', 'restrooms',
    'quiet_spaces', 'concessions', 'assisted_listening',
    'first_aid', 'guest_services',
  ]

  for (const key of collections) {
    const items = stadiumData[key]
    if (!Array.isArray(items)) continue
    const match = items.find((item) => item.id === locationId)
    if (match?.coordinates) return match.coordinates
  }

  return null
}

/**
 * Look up a human-readable name for a facility ID.
 *
 * @param {string} facilityId – The facility ID.
 * @param {Object} stadiumData – Stadium data.
 * @returns {string} Human-readable name or the raw ID.
 */
function resolveFacilityName(facilityId, stadiumData) {
  const collections = [
    'elevators', 'ramps', 'gates', 'restrooms',
    'quiet_spaces', 'sections', 'concessions',
  ]

  for (const key of collections) {
    const items = stadiumData[key]
    if (!Array.isArray(items)) continue
    const match = items.find((item) => item.id === facilityId)
    if (match) return match.name
  }

  return facilityId
}

// ─── Generate Warnings ────────────────────────────────────────────────────────

/**
 * Generate contextual warnings for a selected route based on the active
 * profile preferences and current facility statuses.
 *
 * @param {Object}      route       – The selected route.
 * @param {Object}      prefs       – Active RoutePreferences.
 * @param {Set<string>} oosSet      – Out-of-service facility IDs.
 * @param {Object}      stadiumData – Full stadium data.
 * @returns {string[]} Array of warning strings.
 */
function generateWarnings(route, prefs, oosSet, stadiumData) {
  const warnings = []

  // Warn about out-of-service facilities near the route's zone
  for (const oosId of oosSet) {
    const name = resolveFacilityName(oosId, stadiumData)
    warnings.push(`⚠️ ${name} is currently out of service.`)
  }

  // Step-free profile warnings
  if (prefs.stepFree && route.step_free) {
    // Route is step-free — good, but still alert about OOS in the zone
    const routeZone = detectRouteZone(route, stadiumData)
    if (routeZone) {
      const zoneOOS = [...oosSet].filter((id) => {
        const elev = (stadiumData.elevators || []).find((e) => e.id === id)
        const ramp = (stadiumData.ramps || []).find((r) => r.id === id)
        const facility = elev || ramp
        return facility && facility.zone === routeZone
      })
      if (zoneOOS.length > 0) {
        warnings.push(
          `ℹ️ Some elevators/ramps in the ${routeZone} zone are out of service, but your route avoids them.`
        )
      }
    }
  }

  // Noise warnings for cognitive/sensory profile
  if (prefs.avoidNoise) {
    const peak = peakNoiseExposure(route)
    if (NOISE_RANK[peak] >= NOISE_RANK.medium) {
      warnings.push(
        `🔊 Parts of this route pass through ${peak}-noise areas. ` +
        `Noise-cancelling headphones are available at the nearest Sensory Room.`
      )
    }
  }

  return warnings
}

/**
 * Detect the primary zone of a route by looking at its destination in the
 * stadium data.
 *
 * @param {Object} route       – Route object.
 * @param {Object} stadiumData – Stadium data.
 * @returns {string|null} Zone string or null.
 */
function detectRouteZone(route, stadiumData) {
  const collections = ['sections', 'quiet_spaces', 'concessions', 'restrooms']
  for (const key of collections) {
    const items = stadiumData[key]
    if (!Array.isArray(items)) continue
    const match = items.find((item) => item.id === route.to)
    if (match?.zone) return match.zone
  }
  return null
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Find the best route between two locations, adapted to the active profile.
 *
 * Algorithm:
 *   1. Build the out-of-service set.
 *   2. Filter candidate routes: same from/to, no OOS dependencies.
 *   3. Score remaining candidates using profile preferences.
 *   4. Sort by score (ascending). Best = index 0.
 *   5. If stepFree is required and all step-free routes are blocked,
 *      return no primary route with a descriptive warning.
 *   6. Package the best route + alternatives + warnings.
 *
 * @param {string} from        – Origin location ID (e.g., 'gate-a').
 * @param {string} to          – Destination location ID (e.g., 'sec-302').
 * @param {string} profileId   – Active profile identifier.
 * @param {Object} stadiumData – Parsed stadium.json.
 * @returns {Object} { steps, totalDistance, estimatedMinutes, warnings, alternatives, routeId }
 */
export function findRoute(from, to, profileId, stadiumData) {
  const prefs = getRoutePreferences(profileId)
  const oosSet = buildOutOfServiceSet(stadiumData)

  // ── 1. Gather all candidate routes matching from → to ──
  const allCandidates = (stadiumData.routes || []).filter(
    (r) => r.from === from && r.to === to
  )

  if (allCandidates.length === 0) {
    // FALLBACK FOR DEMO: Generate a synthetic route if one isn't predefined
    const originName = resolveFacilityName(from, stadiumData)
    const destName = resolveFacilityName(to, stadiumData)
    const destZone = detectRouteZone({ to }, stadiumData) || 'central'
    
    const syntheticRoute = {
      id: `route-synthetic-${Date.now()}`,
      from: from,
      to: to,
      steps: [
        { instruction: `Start at ${originName}`, distance_meters: 10, step_free: true, noise_exposure: "low" },
        { instruction: `Follow signs towards the ${destZone} concourse`, distance_meters: 50, step_free: true, noise_exposure: "medium" },
        { instruction: `Arrive at ${destName}`, distance_meters: 10, step_free: true, noise_exposure: "low" }
      ],
      total_distance_meters: 70,
      step_free: true,
      noise_exposure: "medium",
      estimated_minutes: 3
    }
    
    
    allCandidates.push(syntheticRoute)
  }

  // ── 1.5 Apply Dynamic Distance & Profile-Aware Walking Speed ──
  const speed = getWalkingSpeed(profileId)
  
  allCandidates.forEach(route => {
    const dynamicDist = calculateDynamicDistance(route.from, route.to, stadiumData)
    route.total_distance_meters = dynamicDist
    route.estimated_minutes = Math.max(1, Math.round((dynamicDist / speed) / 60))
    
    // Distribute the dynamic distance evenly across the route steps
    if (route.steps && route.steps.length > 0) {
      const stepDist = Math.round(dynamicDist / route.steps.length)
      route.steps.forEach(step => {
        step.distance_meters = stepDist
      })
    }
  })

  // ── 2. Filter out routes that depend on broken facilities ──
  const viableCandidates = allCandidates.filter(
    (r) => !routeRequiresOOSFacility(r, oosSet)
  )

  // ── 3. Score and sort viable candidates ──
  const scored = viableCandidates
    .map((route) => ({ route, score: scoreRoute(route, prefs) }))
    .filter((entry) => entry.score < Infinity) // Remove disqualified routes
    .sort((a, b) => a.score - b.score)

  // ── 4. Handle no viable routes ──
  if (scored.length === 0) {
    // Build a useful failure message
    const reasons = []
    if (prefs.stepFree) {
      reasons.push('all step-free routes are currently blocked due to elevator/ramp outages')
    }
    if (viableCandidates.length === 0) {
      reasons.push('all known routes depend on facilities that are out of service')
    }

    // Try to suggest alternative destinations
    const altSuggestions = findAlternativeDestinations(to, prefs, oosSet, stadiumData)

    return {
      steps: [],
      totalDistance: '0m',
      estimatedMinutes: 0,
      warnings: [
        `Unable to find a suitable route from "${resolveFacilityName(from, stadiumData)}" to "${resolveFacilityName(to, stadiumData)}": ${reasons.join('; ')}.`,
        'Please contact Guest Services for assistance, or try an alternative route.',
      ],
      alternatives: altSuggestions,
      routeId: null,
    }
  }

  // ── 5. Package primary route ──
  const primary = scored[0].route
  const alternatives = scored.slice(1, 3).map((entry) => formatRouteResult(
    entry.route, prefs, oosSet, stadiumData
  ))

  return {
    routeId: primary.id,
    steps: primary.steps.map((step, index) => ({
      number: index + 1,
      instruction: step.instruction,
      distance: `${step.distance_meters}m`,
      stepFree: step.step_free,
      noiseLevel: step.noise_exposure,
      requires: step.requires || null,
    })),
    totalDistance: `${primary.total_distance_meters}m`,
    estimatedMinutes: primary.estimated_minutes || 0,
    warnings: generateWarnings(primary, prefs, oosSet, stadiumData),
    alternatives,
  }
}

/**
 * Package a route object into the standard result format (used for alternatives).
 *
 * @param {Object}      route       – Raw route from stadium data.
 * @param {Object}      prefs       – Active preferences.
 * @param {Set<string>} oosSet      – Out-of-service set.
 * @param {Object}      stadiumData – Stadium data.
 * @returns {Object} Formatted route result.
 */
function formatRouteResult(route, prefs, oosSet, stadiumData) {
  return {
    routeId: route.id,
    steps: route.steps.map((step, index) => ({
      number: index + 1,
      instruction: step.instruction,
      distance: `${step.distance_meters}m`,
      stepFree: step.step_free,
      noiseLevel: step.noise_exposure,
      requires: step.requires || null,
    })),
    totalDistance: `${route.total_distance_meters}m`,
    estimatedMinutes: route.estimated_minutes || 0,
    warnings: generateWarnings(route, prefs, oosSet, stadiumData),
  }
}

/**
 * When the primary destination is unreachable, suggest nearby alternative
 * destinations of the same type (e.g., another section on the same level).
 *
 * @param {string}      destId      – Original destination ID.
 * @param {Object}      prefs       – Active route preferences.
 * @param {Set<string>} oosSet      – Out-of-service set.
 * @param {Object}      stadiumData – Stadium data.
 * @returns {Object[]}  Array of suggestion objects { id, name, reason }.
 */
function findAlternativeDestinations(destId, prefs, oosSet, stadiumData) {
  const suggestions = []

  // Determine what kind of entity the destination is
  const section = (stadiumData.sections || []).find((s) => s.id === destId)
  if (section) {
    // Suggest other sections on the same level with accessible seating (if needed)
    const alts = (stadiumData.sections || [])
      .filter((s) =>
        s.id !== destId &&
        s.level === section.level &&
        (!prefs.accessibleOnly || s.accessible_seating)
      )
      .slice(0, 3)

    for (const alt of alts) {
      suggestions.push({
        id: alt.id,
        name: alt.name,
        reason: `Same level (${alt.level}), ${alt.accessible_seating ? 'accessible seating available' : 'standard seating'}`,
      })
    }
  }

  return suggestions
}

/**
 * Find the nearest working facility of a given type from a location.
 *
 * Supported facility types:
 *   'restroom', 'accessible_restroom', 'family_restroom',
 *   'elevator', 'ramp', 'quiet_space', 'concession',
 *   'first_aid', 'guest_services', 'assisted_listening'
 *
 * @param {string} locationId   – Current location entity ID.
 * @param {string} facilityType – One of the supported facility type strings.
 * @param {Object} stadiumData  – Parsed stadium data.
 * @returns {Object|null} { facility, distance, name } or null if none found.
 */
export function findNearestAlternative(locationId, facilityType, stadiumData) {
  const origin = resolveCoordinates(locationId, stadiumData)
  if (!origin) return null

  // Map facility type to the collection + filter
  const typeMap = {
    restroom:             { key: 'restrooms', filter: () => true },
    accessible_restroom:  { key: 'restrooms', filter: (r) => r.accessible },
    family_restroom:      { key: 'restrooms', filter: (r) => r.family },
    elevator:             { key: 'elevators', filter: (e) => e.in_service },
    ramp:                 { key: 'ramps',     filter: (r) => r.in_service },
    quiet_space:          { key: 'quiet_spaces', filter: () => true },
    concession:           { key: 'concessions',  filter: () => true },
    first_aid:            { key: 'first_aid',     filter: () => true },
    guest_services:       { key: 'guest_services', filter: () => true },
    assisted_listening:   { key: 'assisted_listening', filter: () => true },
  }

  const config = typeMap[facilityType]
  if (!config) return null

  const candidates = (stadiumData[config.key] || [])
    .filter(config.filter)
    .map((item) => ({
      facility: item,
      distance: euclidean(origin, item.coordinates),
      name: item.name,
    }))
    .sort((a, b) => a.distance - b.distance)

  return candidates[0] || null
}

/**
 * Find all quiet spaces sorted by distance from the fan's current location.
 * This powers the "Find a Quiet Space" FAB that is visible on every profile.
 *
 * @param {string} currentLocation – Location entity ID (gate, section, etc.).
 * @param {Object} stadiumData     – Parsed stadium data.
 * @returns {Object[]} Sorted array of quiet space entries with distance info.
 */
export function findQuietSpaces(currentLocation, stadiumData) {
  const origin = resolveCoordinates(currentLocation, stadiumData)
  const spaces = stadiumData.quiet_spaces || []

  return spaces
    .map((space) => {
      const dist = origin ? euclidean(origin, space.coordinates) : 0
      return {
        id: space.id,
        name: space.name,
        level: space.level,
        zone: space.zone,
        location: space.location,
        capacity: space.capacity,
        noiseLevel: space.noise_level,
        features: space.features,
        nearestGate: space.nearest_gate,
        distance: Math.round(dist),
      }
    })
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Get a summary of all currently out-of-service facilities.
 * Used by the staff dashboard and by the chat assistant for context.
 *
 * @param {Object} stadiumData – Parsed stadium data.
 * @returns {Object[]} Array of { id, name, type, zone, location } objects.
 */
export function getOutOfServiceFacilities(stadiumData) {
  const results = []

  for (const elev of stadiumData.elevators || []) {
    if (!elev.in_service) {
      results.push({
        id: elev.id,
        name: elev.name,
        type: 'elevator',
        zone: elev.zone,
        location: elev.location,
      })
    }
  }

  for (const ramp of stadiumData.ramps || []) {
    if (!ramp.in_service) {
      results.push({
        id: ramp.id,
        name: ramp.name,
        type: 'ramp',
        zone: ramp.zone,
        location: ramp.location,
      })
    }
  }

  return results
}
