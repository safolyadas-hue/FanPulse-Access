/**
 * useProfile.js — Profile Hook
 *
 * The single point of access for profile state in any React component.
 * Returns the active profile ID, the switcher function, and automatically
 * resolves the corresponding routePreferences and uiPreferences from the
 * profile engine — so components never need to import profileEngine directly.
 *
 * Usage:
 *   const { profileId, setProfile, routePreferences, uiPreferences, profile } = useProfile()
 */

import { useContext, useMemo } from 'react'
import { ProfileContext } from '../context/ProfileContext.jsx'
import {
  getRoutePreferences,
  getUIPreferences,
  getProfile,
  getResponseFormat,
} from '../services/profileEngine.js'

/**
 * @returns {{
 *   profileId:        string,
 *   setProfile:       (id: string) => void,
 *   profile:          Object,
 *   routePreferences: Object,
 *   uiPreferences:    Object,
 *   responseFormat:   Object,
 * }}
 */
export function useProfile() {
  const context = useContext(ProfileContext)

  if (!context) {
    throw new Error(
      'useProfile() must be used within a <ProfileProvider>. ' +
      'Wrap your app root with <ProfileProvider> in App.jsx.'
    )
  }

  const { activeProfile, setProfile } = context

  /**
   * Derive all preference objects from the active profile.
   * Memoized so they only recompute when the profile changes.
   */
  const derived = useMemo(() => ({
    profile: getProfile(activeProfile),
    routePreferences: getRoutePreferences(activeProfile),
    uiPreferences: getUIPreferences(activeProfile),
    responseFormat: getResponseFormat(activeProfile),
  }), [activeProfile])

  return {
    profileId: activeProfile,
    setProfile,
    ...derived,
  }
}
