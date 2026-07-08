/**
 * sanitize.js — Input Sanitization Utility
 *
 * All user-facing text input in FanPulse Access passes through this module
 * before reaching any service layer (chat, issue reporting, wayfinding).
 *
 * Defense layers:
 *   1. Length enforcement — hard caps per input type.
 *   2. DOMPurify — strips HTML/script tags, event handlers, data URIs.
 *   3. Pattern filtering — catches common injection payloads that survive
 *      DOMPurify in non-HTML contexts (e.g., template literals, JS URIs).
 *   4. Whitespace normalization — collapses runs of whitespace, trims.
 */

import DOMPurify from 'dompurify'

// ─── Length Limits ────────────────────────────────────────────────────────────

/** Maximum character counts per input context. */
export const INPUT_LIMITS = Object.freeze({
  chat: 500,
  issueReport: 1000,
  search: 200,
  profileName: 50,
})

// ─── Dangerous Patterns ───────────────────────────────────────────────────────

/**
 * Regex patterns that flag common injection vectors which might survive
 * DOMPurify when the output is used outside of an HTML context (e.g.,
 * interpolated into a Gemini prompt or logged to console).
 *
 * Each entry: [pattern, replacement]
 */
const DANGEROUS_PATTERNS = [
  // Script / event injection
  [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''],
  [/on\w+\s*=\s*(['"]?).*?\1/gi, ''],

  // Javascript: / data: URI schemes
  [/javascript\s*:/gi, ''],
  [/data\s*:\s*text\/html/gi, ''],
  [/vbscript\s*:/gi, ''],

  // Expression / eval injection
  [/expression\s*\(/gi, ''],
  [/eval\s*\(/gi, ''],
  [/Function\s*\(/gi, ''],

  // HTML entities used to bypass filters
  [/&#\d+;?/g, ''],
  [/&#x[\da-fA-F]+;?/g, ''],
]

// ─── DOMPurify Configuration ─────────────────────────────────────────────────

/** Restrictive DOMPurify config: text-only output, no tags allowed. */
const PURIFY_CONFIG = Object.freeze({
  ALLOWED_TAGS: [],        // Strip ALL HTML tags
  ALLOWED_ATTR: [],        // Strip ALL attributes
  KEEP_CONTENT: true,      // Preserve the text content inside stripped tags
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
})

// ─── Core Sanitization ───────────────────────────────────────────────────────

/**
 * Sanitize user input text. This is the primary public function.
 *
 * @param {string} input   – Raw user input.
 * @param {string} [context='chat'] – Input context key from INPUT_LIMITS.
 * @returns {{ clean: string, wasTruncated: boolean, wasModified: boolean }}
 *   - clean:        Sanitized text, safe for use in prompts and UI.
 *   - wasTruncated: True if the input exceeded the length limit.
 *   - wasModified:  True if sanitization changed the input (beyond trimming).
 */
export function sanitizeInput(input, context = 'chat') {
  // Guard: non-string or empty input
  if (typeof input !== 'string') {
    return { clean: '', wasTruncated: false, wasModified: true }
  }

  const maxLength = INPUT_LIMITS[context] || INPUT_LIMITS.chat
  let text = input
  let wasModified = false
  let wasTruncated = false

  // ── Step 1: DOMPurify pass ──
  const purified = DOMPurify.sanitize(text, PURIFY_CONFIG)
  if (purified !== text) {
    wasModified = true
    text = purified
  }

  // ── Step 2: Pattern filtering ──
  for (const [pattern, replacement] of DANGEROUS_PATTERNS) {
    const before = text
    text = text.replace(pattern, replacement)
    if (text !== before) wasModified = true
  }

  // ── Step 3: Whitespace normalization ──
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized !== text) {
    // Don't flag whitespace-only changes as "modified"
    text = normalized
  }

  // ── Step 4: Length enforcement ──
  if (text.length > maxLength) {
    text = text.slice(0, maxLength)
    wasTruncated = true
  }

  return { clean: text, wasTruncated, wasModified }
}

/**
 * Quick boolean check: is this input safe as-is?
 * Useful for form validation before submission.
 *
 * @param {string} input   – Raw input to check.
 * @param {string} [context='chat'] – Input context.
 * @returns {boolean} True if sanitization would not alter the input.
 */
export function isInputSafe(input, context = 'chat') {
  if (typeof input !== 'string') return false
  const { wasModified, wasTruncated } = sanitizeInput(input, context)
  return !wasModified && !wasTruncated
}
