/**
 * chatService.js — Profile-Adaptive Chat Orchestrator
 *
 * The middleware between the UI (useChat hook) and the Gemini SDK.
 * Responsibilities:
 *   1. Load the stadium context data (once, then cache).
 *   2. Fetch the profile-specific system prompt from profileEngine.
 *   3. Inject multilingual auto-detection instructions.
 *   4. Forward everything to geminiService.generateResponse().
 *   5. Return the AI response text to the hook.
 *
 * This module does NOT handle sanitization or rate limiting — that is the
 * hook's responsibility, keeping this layer focused on orchestration.
 */

import { generateResponse, isGeminiAvailable } from './geminiService.js'

import stadiumData from '../data/stadium.json'

// ─── Stadium Context ──────────────────────────────────────────────────────────

/**
 * Build a condensed text summary of the stadium data for Gemini context.
 * Cached after first call to avoid re-serializing on every message.
 */
let cachedStadiumContext = null

function getStadiumContext() {
  if (cachedStadiumContext) return cachedStadiumContext

  // Build a focused summary rather than dumping the full 28KB JSON.
  // This keeps token usage efficient while giving Gemini everything it needs.
  const { venue, gates, sections, elevators, restrooms, quiet_spaces: quietSpaces, concessions } = stadiumData

  const lines = [
    `VENUE: ${venue.name}, ${venue.location}. Capacity: ${venue.capacity}. Event: ${venue.event}.`,
    `LEVELS: ${venue.levels.map(l => l.name).join(', ')}.`,
    '',
    'GATES:',
    ...gates.map(g => `  ${g.name} (${g.direction}) — Accessible: ${g.accessible ? 'Yes' : 'No'}`),
    '',
    'SECTIONS:',
    ...sections.map(s =>
      `  ${s.name} (${s.level}, ${s.zone}) — Accessible seating: ${s.accessible_seating ? 'Yes' : 'No'}, Companion seats: ${s.companion_seats}, Noise: ${s.noise_level}`
    ),
    '',
    'ELEVATORS:',
    ...(elevators || []).map(e =>
      `  ${e.name} — Levels: ${e.from_level} to ${e.to_level}. Status: ${e.in_service ? 'operational' : '⚠️ OUT OF SERVICE'}`
    ),
    '',
    'RESTROOMS:',
    ...(restrooms || []).map(r =>
      `  ${r.name} (${r.level}, ${r.zone}) — Accessible: ${r.accessible ? 'Yes' : 'No'}, Family: ${r.family ? 'Yes' : 'No'}`
    ),
    '',
    'QUIET/CALM SPACES:',
    ...(quietSpaces || []).map(q =>
      `  ${q.name} (${q.level}) — Capacity: ${q.capacity}, Noise: ${q.noise_level}. ${q.description}`
    ),
    '',
    'CONCESSIONS:',
    ...(concessions || []).map(c =>
      `  ${c.name} (${c.level}, ${c.zone}) — Type: ${c.type}${c.halal ? ', Halal' : ''}${c.kosher ? ', Kosher' : ''}${c.vegan ? ', Vegan' : ''}`
    ),
  ]

  cachedStadiumContext = lines.join('\n')
  return cachedStadiumContext
}

// ─── Multilingual System Prompt Enhancement ───────────────────────────────────

// System prompt building has been moved to the backend.

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a fan's message to Gemini with full profile + stadium context.
 *
 * @param {string}   message    – The sanitized user message.
 * @param {string}   profileId  – Active accessibility profile ID.
 * @param {object[]} history    – Prior conversation turns [{role, parts}].
 * @returns {Promise<string>}   The AI assistant's response text.
 * @throws {Error}              If Gemini is unavailable or the API call fails.
 */
export async function sendChatMessage(message, profileId, history = []) {
  if (!isGeminiAvailable()) {
    throw new Error(
      'The AI assistant is currently unavailable. ' +
      'Please check your API key configuration or try again later.'
    )
  }

  const stadiumContext = getStadiumContext()

  const responseText = await generateResponse(
    profileId,
    message,
    history,
    stadiumContext,
  )

  return responseText
}

/**
 * Check if the chat service can function (API key is present and valid).
 * @returns {boolean}
 */
export function isChatAvailable() {
  return isGeminiAvailable()
}
