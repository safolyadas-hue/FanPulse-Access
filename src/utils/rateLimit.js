/**
 * rateLimit.js — Client-Side Rate Limiter
 *
 * Implements a token-bucket algorithm to throttle outgoing API calls
 * (primarily Gemini chat requests). This is a client-side guard — it does
 * NOT replace server-side rate limiting, but prevents accidental spam and
 * provides immediate user feedback.
 *
 * Default: 10 tokens (requests) per 60-second window, refilling at
 * 1 token every 6 seconds.
 *
 * Usage:
 *   const limiter = createRateLimiter()
 *   if (limiter.tryConsume()) { /* send request *\/ }
 *   else { /* show "slow down" message *\/ }
 */

// ─── Token Bucket Implementation ─────────────────────────────────────────────

/**
 * Create a rate limiter instance with configurable capacity and refill rate.
 *
 * @param {Object}  [options]
 * @param {number}  [options.maxTokens=10]        – Bucket capacity.
 * @param {number}  [options.refillIntervalMs=6000] – Milliseconds between token refills.
 * @param {number}  [options.tokensPerRefill=1]   – Tokens added per refill interval.
 * @returns {Object} Rate limiter API.
 */
export function createRateLimiter({
  maxTokens = 10,
  refillIntervalMs = 6000,
  tokensPerRefill = 1,
} = {}) {
  let tokens = maxTokens
  let lastRefillTime = Date.now()

  /**
   * Refill tokens based on elapsed time since last refill.
   * Called internally before every consume attempt.
   */
  function refill() {
    const now = Date.now()
    const elapsed = now - lastRefillTime
    const refillCount = Math.floor(elapsed / refillIntervalMs) * tokensPerRefill

    if (refillCount > 0) {
      tokens = Math.min(maxTokens, tokens + refillCount)
      // Advance lastRefillTime by the refilled amount (not to `now`)
      // to preserve fractional interval progress
      lastRefillTime += Math.floor(elapsed / refillIntervalMs) * refillIntervalMs
    }
  }

  return {
    /**
     * Attempt to consume one token.
     *
     * @returns {boolean} True if the request is allowed, false if rate-limited.
     */
    tryConsume() {
      refill()
      if (tokens > 0) {
        tokens -= 1
        return true
      }
      return false
    },

    /**
     * Get the current number of available tokens (for UI display).
     *
     * @returns {number} Available tokens.
     */
    getAvailableTokens() {
      refill()
      return tokens
    },

    /**
     * Get milliseconds until the next token becomes available.
     * Returns 0 if tokens are already available.
     *
     * @returns {number} Wait time in milliseconds.
     */
    getWaitTimeMs() {
      refill()
      if (tokens > 0) return 0
      const elapsed = Date.now() - lastRefillTime
      return Math.max(0, refillIntervalMs - elapsed)
    },

    /**
     * Reset the limiter to full capacity (e.g., on profile switch or page reload).
     */
    reset() {
      tokens = maxTokens
      lastRefillTime = Date.now()
    },
  }
}

// ─── Singleton Instance ───────────────────────────────────────────────────────

/**
 * Shared singleton rate limiter for the Gemini chat API.
 * 10 requests per minute, refilling 1 token every 6 seconds.
 */
export const chatRateLimiter = createRateLimiter({
  maxTokens: 10,
  refillIntervalMs: 6000,
  tokensPerRefill: 1,
})
