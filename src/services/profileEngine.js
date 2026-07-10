/**
 * profileEngine.js — Centralized Profile-Adaptive Engine
 *
 * THE SINGLE SOURCE OF TRUTH for all profile-dependent behavior in FanPulse
 * Access. Every other service (routing, chat, UI rendering) calls into this
 * module with a `profileId` string and receives back the configuration it
 * needs. There are zero separate code paths per profile anywhere else in the
 * codebase — just configuration objects consumed by shared engines.
 *
 * Profiles:
 *   standard  – Default. Fast, full-featured, no restrictions.
 *   mobility  – Step-free routes, accessible seating/restrooms, elevator alerts.
 *   vision    – Audio-first, high-contrast UI, landmark-heavy directions.
 *   hearing   – Visual/text-only alerts, caption-ready, no audio reliance.
 *   cognitive – Short literal language, low-noise routes, quiet-space emphasis.
 */

// ─── Profile Definitions ──────────────────────────────────────────────────────

export const PROFILES = Object.freeze({
  standard: {
    id: 'standard',
    label: 'Standard',
    icon: '🏟️',
    description: 'Fast, full-featured experience for every fan.',
    color: 'primary',
  },
  mobility: {
    id: 'mobility',
    label: 'Mobility',
    icon: '♿',
    description: 'Step-free routes, accessible seating & restrooms.',
    color: 'accent',
  },
  vision: {
    id: 'vision',
    label: 'Vision',
    icon: '👁️',
    description: 'Audio-first, high-contrast, landmark-based navigation.',
    color: 'warning',
  },
  hearing: {
    id: 'hearing',
    label: 'Hearing',
    icon: '🦻',
    description: 'Visual/text alerts, captions, no audio dependency.',
    color: 'success',
  },
  cognitive: {
    id: 'cognitive',
    label: 'Cognitive / Sensory',
    icon: '🧠',
    description: 'Simple language, quiet routes, calm-space focus.',
    color: 'danger',
  },
})

/** Ordered list of profile IDs for iteration in UI components. */
export const PROFILE_IDS = Object.freeze([
  'standard',
  'mobility',
  'vision',
  'hearing',
  'cognitive',
])

/** Default profile when no selection has been made. */
export const DEFAULT_PROFILE_ID = 'standard'

// ─── Route Preferences ────────────────────────────────────────────────────────

/**
 * Per-profile constraints applied by the routing engine when scoring and
 * filtering candidate routes.
 *
 * @typedef {Object} RoutePreferences
 * @property {boolean} stepFree       – Require step-free (no stairs) routes.
 * @property {boolean} avoidNoise     – Penalize/exclude high-noise segments.
 * @property {boolean} preferQuiet    – Prefer routes near quiet/calm zones.
 * @property {boolean} accessibleOnly – Only show accessible gates/restrooms.
 * @property {boolean} preferShort    – Optimize purely for shortest distance.
 * @property {boolean} avoidCrowds    – Route away from crowded concourses.
 */
const ROUTE_PREFERENCES = Object.freeze({
  standard: {
    stepFree: false,
    avoidNoise: false,
    preferQuiet: false,
    accessibleOnly: false,
    preferShort: true,
    avoidCrowds: false,
  },
  mobility: {
    stepFree: true,
    avoidNoise: false,
    preferQuiet: false,
    accessibleOnly: true,
    preferShort: false,
    avoidCrowds: false,
  },
  vision: {
    stepFree: false,
    avoidNoise: false,
    preferQuiet: false,
    accessibleOnly: false,
    preferShort: true,
    avoidCrowds: false,
  },
  hearing: {
    stepFree: false,
    avoidNoise: false,
    preferQuiet: false,
    accessibleOnly: false,
    preferShort: true,
    avoidCrowds: false,
  },
  cognitive: {
    stepFree: false,
    avoidNoise: true,
    preferQuiet: true,
    accessibleOnly: false,
    preferShort: false,
    avoidCrowds: true,
  },
})

// ─── UI Preferences ───────────────────────────────────────────────────────────

/**
 * Presentation-layer preferences consumed by React components to adapt the
 * visual/audio experience without branching on profile IDs in JSX.
 *
 * @typedef {Object} UIPreferences
 * @property {boolean} highContrast       – Use high-contrast color scheme.
 * @property {boolean} largeText          – Increase base font size.
 * @property {boolean} reduceMotion       – Suppress animations/transitions.
 * @property {boolean} audioFirst         – Auto-play TTS on responses.
 * @property {boolean} visualAlerts       – Flash/border alerts instead of sound.
 * @property {boolean} simplifiedLanguage – Short sentences, no idioms.
 * @property {boolean} showQuietFAB       – Always show "Find Quiet Space" FAB.
 * @property {boolean} showCaptions       – Show text captions on all media.
 * @property {boolean} landmarkNav        – Add landmark descriptions to routes.
 */
const UI_PREFERENCES = Object.freeze({
  standard: {
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    audioFirst: false,
    visualAlerts: false,
    simplifiedLanguage: false,
    showQuietFAB: true,      // Available to everyone, not just cognitive
    showCaptions: false,
    landmarkNav: false,
  },
  mobility: {
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    audioFirst: false,
    visualAlerts: false,
    simplifiedLanguage: false,
    showQuietFAB: true,
    showCaptions: false,
    landmarkNav: false,
  },
  vision: {
    highContrast: true,
    largeText: true,
    reduceMotion: false,
    audioFirst: true,
    visualAlerts: false,
    simplifiedLanguage: false,
    showQuietFAB: true,
    showCaptions: false,
    landmarkNav: true,
  },
  hearing: {
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    audioFirst: false,
    visualAlerts: true,
    simplifiedLanguage: false,
    showQuietFAB: true,
    showCaptions: true,
    landmarkNav: false,
  },
  cognitive: {
    highContrast: false,
    largeText: true,
    reduceMotion: true,
    audioFirst: false,
    visualAlerts: true,
    simplifiedLanguage: true,
    showQuietFAB: true,       // Always prominent for this profile
    showCaptions: true,
    landmarkNav: false,
  },
})

// getChatSystemPrompt has been moved to the secure backend (netlify/functions/chat.js)

// ─── Response Format Hints ────────────────────────────────────────────────────

/**
 * Structural constraints that chatService applies when post-processing
 * Gemini output. These are hints, not hard rules — the service uses them
 * to truncate or reformat when needed.
 */
const RESPONSE_FORMAT = Object.freeze({
  standard: {
    maxSentences: 20,
    vocabulary: 'natural',
    structure: 'flexible',
    preferBullets: true,
  },
  mobility: {
    maxSentences: 20,
    vocabulary: 'natural',
    structure: 'structured',
    preferBullets: true,
  },
  vision: {
    maxSentences: 25,
    vocabulary: 'descriptive',
    structure: 'numbered-steps',
    preferBullets: false,
  },
  hearing: {
    maxSentences: 20,
    vocabulary: 'natural',
    structure: 'structured',
    preferBullets: true,
  },
  cognitive: {
    maxSentences: 10,
    vocabulary: 'simple',
    structure: 'numbered-steps',
    preferBullets: false,
  },
})

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve the route-filtering preferences for a given profile.
 *
 * @param {string} profileId – Profile identifier (e.g., 'mobility').
 * @returns {RoutePreferences} Frozen preference object.
 * @throws {Error} If profileId is not recognized.
 */
export function getRoutePreferences(profileId) {
  const prefs = ROUTE_PREFERENCES[profileId]
  if (!prefs) {
    throw new Error(`Unknown profile ID: "${profileId}". Valid IDs: ${PROFILE_IDS.join(', ')}`)
  }
  return prefs
}

/**
 * Retrieve the UI presentation preferences for a given profile.
 *
 * @param {string} profileId – Profile identifier.
 * @returns {UIPreferences} Frozen preference object.
 * @throws {Error} If profileId is not recognized.
 */
export function getUIPreferences(profileId) {
  const prefs = UI_PREFERENCES[profileId]
  if (!prefs) {
    throw new Error(`Unknown profile ID: "${profileId}". Valid IDs: ${PROFILE_IDS.join(', ')}`)
  }
  return prefs
}

/**
 * Retrieve the response format hints for post-processing chat output.
 *
 * @param {string} profileId – Profile identifier.
 * @returns {Object} Format hints ({ maxSentences, vocabulary, structure, preferBullets }).
 */
export function getResponseFormat(profileId) {
  return RESPONSE_FORMAT[profileId] || RESPONSE_FORMAT.standard
}

/**
 * Retrieve the full profile metadata object.
 *
 * @param {string} profileId – Profile identifier.
 * @returns {Object|null} Profile object or null if not found.
 */
export function getProfile(profileId) {
  return PROFILES[profileId] || null
}

/**
 * Validate that a string is a known profile ID.
 *
 * @param {string} profileId – String to check.
 * @returns {boolean}
 */
export function isValidProfileId(profileId) {
  return PROFILE_IDS.includes(profileId)
}
