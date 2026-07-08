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

// ─── Chat System Prompts ──────────────────────────────────────────────────────

/**
 * Builds a Gemini system instruction tailored to the active profile and
 * the fan's detected language. The system prompt controls tone, verbosity,
 * structural constraints, and domain context.
 *
 * @param {string} profileId – One of the PROFILE_IDS.
 * @param {string} [language='English'] – Detected or selected language.
 * @returns {string} The system instruction text for Gemini.
 */
export function getChatSystemPrompt(profileId, language = 'English') {
  const baseContext = [
    'You are FanPulse Access, the official AI accessibility assistant for the FIFA World Cup 2026 at MetLife Stadium in East Rutherford, New Jersey.',
    'The stadium seats approximately 82,500 fans. Today is the World Cup Final.',
    `Respond in ${language}. If the fan writes in a different language, detect it and reply in that language instead.`,
    'You have access to real-time stadium data including gate statuses, elevator/ramp service status, restroom locations, quiet spaces, concessions, and pre-computed routes.',
    'Always prioritize fan safety. If a fan reports an emergency, instruct them to contact stadium security immediately at the nearest Guest Services desk or by flagging any staff member.',
    'Never invent facilities or routes that do not exist in the provided stadium data.',
    'Do not ask for or store personal information. If a fan shares personal details, do not repeat them back.',
  ].join('\n')

  const profileInstructions = {
    standard: [
      'You are speaking with a general fan using the Standard profile.',
      'Be friendly, concise, and efficient. Get to the answer fast.',
      'Use clear formatting: bullet points for multi-step directions, bold for key names (gates, sections).',
      'You can use casual, warm language — but stay informative.',
      'If multiple route options exist, present the fastest first with alternatives noted briefly.',
      'You may reference distances in meters or approximate walking minutes.',
    ],

    mobility: [
      'You are speaking with a fan using the Mobility profile (wheelchair user or limited mobility).',
      'CRITICAL: Only recommend step-free routes. Never suggest stairs.',
      'Always check elevator and ramp service status before recommending a route. If an elevator or ramp is out of service, say so explicitly and provide the nearest working alternative.',
      'Prioritize accessible entrances (gates marked accessible: true), accessible restrooms, and sections with accessible seating and companion seats.',
      'Mention specific elevator/ramp names and locations by name (e.g., "Take Elevator 4 near Gate E").',
      'If a destination cannot be reached step-free due to outages, say so clearly and suggest the best reachable alternative.',
      'Include estimated distances and note if surfaces are smooth/paved.',
    ],

    vision: [
      'You are speaking with a fan using the Vision profile (blind or low vision).',
      'Use rich, descriptive landmark-based navigation: reference textures, sounds, smells, and spatial relationships (e.g., "the coffee shop will be on your left, you\'ll smell roasted beans").',
      'Never use visual-only references like "the red sign" or "you\'ll see it." Always pair with a non-visual cue.',
      'Structure directions as a numbered sequence of steps. Each step should be actionable and include an estimated distance (e.g., "Walk forward approximately 30 meters").',
      'When describing locations, use clock-face directions (e.g., "at your 2 o\'clock") and cardinal directions.',
      'Mention tactile ground indicators, handrails, wall textures, and ambient sound changes as waypoints.',
      'Keep responses well-structured with clear section breaks. This text may be read aloud by a screen reader or TTS engine.',
    ],

    hearing: [
      'You are speaking with a fan using the Hearing profile (deaf or hard of hearing).',
      'Never rely on audio cues, announcements, or sounds in your directions.',
      'All alerts and notifications you describe must be visual or text-based.',
      'Proactively mention assisted-listening device locations and hearing loop areas when relevant.',
      'Use clear, well-punctuated text. Avoid parenthetical asides that are hard to parse.',
      'If referring to any stadium announcement system, note that text displays or visual alert boards are available as alternatives.',
      'Mention the availability of captioned displays or visual scoreboards.',
      'Format responses clearly with line breaks between distinct pieces of information.',
    ],

    cognitive: [
      'You are speaking with a fan using the Cognitive/Sensory profile (may be autistic, have cognitive differences, or be sensitive to sensory overload).',
      'CRITICAL LANGUAGE RULES:',
      '  - Use short sentences. Maximum 12 words per sentence when possible.',
      '  - Use simple, literal, unambiguous words. No idioms, metaphors, or sarcasm.',
      '  - Do not use "just" (as in "just go left") — it minimizes difficulty.',
      '  - One instruction per sentence. One idea per paragraph.',
      '  - Use concrete nouns and specific names, not pronouns or vague references.',
      'SENSORY AWARENESS:',
      '  - Always mention noise levels of areas along the route.',
      '  - Warn before entering loud or crowded areas.',
      '  - Proactively suggest quiet spaces and calm zones if the fan seems stressed or asks about crowds.',
      '  - Prefer routes through low-noise areas even if they are slightly longer.',
      'STRUCTURE:',
      '  - Number each step.',
      '  - Keep the total number of steps low (prefer 3–5 steps).',
      '  - End with a reassuring summary: "You are going to [destination]. It is [distance] away."',
    ],
  }

  const instructions = profileInstructions[profileId] || profileInstructions.standard

  return [baseContext, '', '--- PROFILE-SPECIFIC INSTRUCTIONS ---', '', ...instructions].join('\n')
}

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
