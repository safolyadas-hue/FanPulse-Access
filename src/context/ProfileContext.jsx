/**
 * ProfileContext.jsx — Profile State Provider
 *
 * Stores the active accessibility profile in React state, persisted to
 * localStorage so the fan's choice survives page reloads. Defaults to
 * 'standard' when no selection has been made.
 *
 * Provides:
 *   - activeProfile: string    – Current profile ID.
 *   - setProfile:    function  – Switch to a different profile.
 *
 * Consumed via the useProfile() hook — components should never import
 * this context directly.
 */

import { createContext, useState, useCallback, useMemo } from 'react'
import { DEFAULT_PROFILE_ID, isValidProfileId } from '../services/profileEngine.js'

const STORAGE_KEY = 'fanpulse_active_profile'

/**
 * Read the persisted profile ID from localStorage.
 * Falls back to the default if the stored value is missing or invalid.
 *
 * @returns {string} A valid profile ID.
 */
function getInitialProfile() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isValidProfileId(stored)) {
      return stored
    }
  } catch {
    // localStorage may be unavailable (private browsing, storage quota, etc.)
  }
  return DEFAULT_PROFILE_ID
}

/** @type {React.Context} */
export const ProfileContext = createContext(null)

/**
 * Provider component. Wrap the app root with this to make profile state
 * available to all descendant components via useProfile().
 *
 * @param {{ children: React.ReactNode }} props
 */
export function ProfileProvider({ children }) {
  const [activeProfile, setActiveProfile] = useState(getInitialProfile)

  /**
   * Switch the active profile. Validates the ID, updates state, and
   * persists to localStorage.
   *
   * @param {string} profileId – New profile ID to activate.
   */
  const setProfile = useCallback((profileId) => {
    if (!isValidProfileId(profileId)) {
      console.warn(`ProfileProvider: ignoring invalid profile ID "${profileId}"`)
      return
    }

    setActiveProfile(profileId)

    try {
      localStorage.setItem(STORAGE_KEY, profileId)
    } catch {
      // Silently ignore storage failures
    }
  }, [])

  /** Memoize the context value to prevent unnecessary re-renders. */
  const value = useMemo(
    () => ({ activeProfile, setProfile }),
    [activeProfile, setProfile]
  )

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  )
}
