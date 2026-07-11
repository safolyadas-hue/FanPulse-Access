import { describe, it, expect } from 'vitest'
import {
  PROFILE_IDS,
  DEFAULT_PROFILE_ID,
  getRoutePreferences,
  getUIPreferences,
  getResponseFormat,
  getProfile,
  isValidProfileId,
} from '../services/profileEngine.js'

describe('PROFILE_IDS', () => {
  it('contains exactly the 5 expected profiles', () => {
    expect(PROFILE_IDS).toEqual(['standard', 'mobility', 'vision', 'hearing', 'cognitive'])
  })

  it('defaults to the standard profile', () => {
    expect(DEFAULT_PROFILE_ID).toBe('standard')
  })
})

describe('getRoutePreferences', () => {
  it('returns a preference object for every valid profile', () => {
    for (const id of PROFILE_IDS) {
      const prefs = getRoutePreferences(id)
      expect(prefs).toHaveProperty('stepFree')
      expect(prefs).toHaveProperty('avoidNoise')
      expect(prefs).toHaveProperty('preferShort')
    }
  })

  it('requires step-free routing only for the Mobility profile', () => {
    expect(getRoutePreferences('mobility').stepFree).toBe(true)
    for (const id of ['standard', 'vision', 'hearing', 'cognitive']) {
      expect(getRoutePreferences(id).stepFree).toBe(false)
    }
  })

  it('enables noise avoidance and crowd avoidance only for the Cognitive/Sensory profile', () => {
    const cognitive = getRoutePreferences('cognitive')
    expect(cognitive.avoidNoise).toBe(true)
    expect(cognitive.avoidCrowds).toBe(true)

    for (const id of ['standard', 'mobility', 'vision', 'hearing']) {
      expect(getRoutePreferences(id).avoidNoise).toBe(false)
    }
  })

  it('throws a descriptive error for an unknown profile ID', () => {
    expect(() => getRoutePreferences('not_a_real_profile')).toThrow(/Unknown profile ID/)
  })
})

describe('getUIPreferences', () => {
  it('enables audio-first and high-contrast only for the Vision profile', () => {
    const vision = getUIPreferences('vision')
    expect(vision.audioFirst).toBe(true)
    expect(vision.highContrast).toBe(true)

    for (const id of ['standard', 'mobility', 'hearing', 'cognitive']) {
      expect(getUIPreferences(id).audioFirst).toBe(false)
    }
  })

  it('enables visual alerts and captions for the Hearing profile', () => {
    const hearing = getUIPreferences('hearing')
    expect(hearing.visualAlerts).toBe(true)
    expect(hearing.showCaptions).toBe(true)
    expect(hearing.audioFirst).toBe(false)
  })

  it('enables simplified language and reduced motion only for Cognitive/Sensory', () => {
    const cognitive = getUIPreferences('cognitive')
    expect(cognitive.simplifiedLanguage).toBe(true)
    expect(cognitive.reduceMotion).toBe(true)

    for (const id of ['standard', 'mobility', 'vision', 'hearing']) {
      expect(getUIPreferences(id).simplifiedLanguage).toBe(false)
    }
  })

  it('shows the quiet-space FAB for every profile, not just Cognitive', () => {
    for (const id of PROFILE_IDS) {
      expect(getUIPreferences(id).showQuietFAB).toBe(true)
    }
  })

  it('throws a descriptive error for an unknown profile ID', () => {
    expect(() => getUIPreferences('not_a_real_profile')).toThrow(/Unknown profile ID/)
  })
})

describe('getResponseFormat', () => {
  it('gives the Cognitive/Sensory profile the shortest response format', () => {
    const cognitive = getResponseFormat('cognitive')
    expect(cognitive.maxSentences).toBeLessThan(getResponseFormat('vision').maxSentences)
    expect(cognitive.vocabulary).toBe('simple')
  })

  it('falls back to the standard format for an unrecognized profile', () => {
    expect(getResponseFormat('not_a_real_profile')).toEqual(getResponseFormat('standard'))
  })
})

describe('getProfile', () => {
  it('returns full metadata for a known profile', () => {
    const profile = getProfile('mobility')
    expect(profile).toMatchObject({ id: 'mobility', label: 'Mobility' })
  })

  it('returns null for an unknown profile', () => {
    expect(getProfile('not_a_real_profile')).toBeNull()
  })
})

describe('isValidProfileId', () => {
  it('returns true for all 5 real profile IDs', () => {
    for (const id of PROFILE_IDS) {
      expect(isValidProfileId(id)).toBe(true)
    }
  })

  it('returns false for an invalid or arbitrary string', () => {
    expect(isValidProfileId('admin')).toBe(false)
    expect(isValidProfileId('')).toBe(false)
  })
})
