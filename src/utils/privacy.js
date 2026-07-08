/**
 * privacy.js — PII Stripping Utility
 *
 * Removes Personally Identifiable Information from text before it is:
 *   - Sent to the Gemini API as context or logged queries
 *   - Written to client-side logs or localStorage
 *   - Displayed in the staff dashboard issue queue
 *
 * This is a best-effort client-side defense. It catches common PII formats
 * (emails, phone numbers, SSN-like patterns, credit card-like sequences)
 * and replaces them with redaction markers.
 *
 * It does NOT catch all possible PII (e.g., arbitrary names in free text).
 * The on-screen privacy notice informs fans that AI processes their messages
 * and no personal data is stored.
 */

// ─── PII Patterns ─────────────────────────────────────────────────────────────

/**
 * Each entry: { name, pattern, replacement }
 *
 * Patterns are ordered from most specific to least specific to avoid
 * partial matches interfering with broader patterns.
 */
const PII_PATTERNS = [
  {
    name: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL REDACTED]',
  },
  {
    name: 'phone_international',
    // Matches: +1-234-567-8900, +44 20 7946 0958, +91 98765 43210
    pattern: /\+\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,
    replacement: '[PHONE REDACTED]',
  },
  {
    name: 'phone_us',
    // Matches: (234) 567-8900, 234-567-8900, 234.567.8900, 2345678900
    pattern: /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,
    replacement: '[PHONE REDACTED]',
  },
  {
    name: 'ssn',
    // Matches: 123-45-6789, 123 45 6789
    pattern: /\b\d{3}[\s-]\d{2}[\s-]\d{4}\b/g,
    replacement: '[SSN REDACTED]',
  },
  {
    name: 'credit_card',
    // Matches: 1234 5678 9012 3456, 1234-5678-9012-3456
    pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    replacement: '[CARD REDACTED]',
  },
  {
    name: 'ip_address',
    // Matches: 192.168.1.1, 10.0.0.255
    pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
    replacement: '[IP REDACTED]',
  },
]

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Strip detected PII from a text string.
 *
 * @param {string} text – Input text that may contain PII.
 * @returns {{ cleaned: string, redactions: string[] }}
 *   - cleaned:    Text with PII replaced by redaction markers.
 *   - redactions: List of PII type names that were found and removed.
 */
export function stripPII(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return { cleaned: '', redactions: [] }
  }

  let cleaned = text
  const redactions = []

  for (const { name, pattern, replacement } of PII_PATTERNS) {
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0
    if (pattern.test(cleaned)) {
      redactions.push(name)
      // Reset again before replace (test() advances lastIndex)
      pattern.lastIndex = 0
      cleaned = cleaned.replace(pattern, replacement)
    }
  }

  return { cleaned, redactions }
}

/**
 * Check whether text contains any detectable PII.
 *
 * @param {string} text – Input text to scan.
 * @returns {boolean} True if PII was detected.
 */
export function containsPII(text) {
  if (typeof text !== 'string') return false

  for (const { pattern } of PII_PATTERNS) {
    pattern.lastIndex = 0
    if (pattern.test(text)) return true
  }

  return false
}

/**
 * Create a privacy-safe summary of a fan's query for logging purposes.
 * Truncates to a maximum length and strips all PII.
 *
 * @param {string} query    – Raw fan query.
 * @param {number} [maxLen=100] – Maximum summary length.
 * @returns {string} Redacted, truncated summary.
 */
export function createSafeLogEntry(query, maxLen = 100) {
  const { cleaned } = stripPII(query)
  const truncated = cleaned.length > maxLen
    ? cleaned.slice(0, maxLen) + '...'
    : cleaned
  return truncated
}
