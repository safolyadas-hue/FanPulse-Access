/**
 * useChat.js — Chat State & Action Hook
 *
 * Manages the messages array, loading/error state, and provides a
 * sendMessage(text) function that enforces the full security pipeline:
 *   1. sanitize.js  → strips XSS / enforces 500-char limit
 *   2. privacy.js   → redacts PII before sending to Gemini
 *   3. rateLimit.js  → token-bucket check (10 req/min)
 *   4. chatService   → profile-adapted Gemini call
 *
 * Message shape:
 *   { id, role, text, timestamp, profileId }
 *   - role: 'user' | 'assistant' | 'system'
 */

import { useState, useCallback } from 'react'
import { useProfile } from './useProfile.js'
import { sanitizeInput } from '../utils/sanitize.js'
import { stripPII } from '../utils/privacy.js'
import { chatRateLimiter } from '../utils/rateLimit.js'
import { sendChatMessage, isChatAvailable } from '../services/chatService.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

let messageCounter = 0

function createMessage(role, text, profileId = null) {
  return {
    id: `msg-${Date.now()}-${++messageCounter}`,
    role,
    text,
    timestamp: new Date().toISOString(),
    profileId,
  }
}

function toGeminiHistory(messages) {
  const history = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: m.text,
    }))
  
  // Gemini requires the history to start with a 'user' message.
  // Drop any leading 'model' messages (like the welcome message).
  while (history.length > 0 && history[0].role === 'model') {
    history.shift()
  }
  return history
}

// ─── Welcome Messages ────────────────────────────────────────────────────────

const WELCOME_MESSAGES = {
  standard: "Welcome to FanPulse Access! 🏟️ I'm your AI stadium assistant for the FIFA World Cup 2026 Final at MetLife Stadium. Ask me about directions, facilities, food, or anything else you need!",
  mobility: "Welcome to FanPulse Access! ♿ I'm configured for mobility-first assistance. I'll only suggest step-free routes and prioritize accessible facilities. How can I help you navigate the stadium?",
  vision: "Welcome to FanPulse Access. I am your audio-descriptive stadium assistant. I will provide landmark-based, step-by-step directions using spatial cues, textures, and sounds. What do you need help finding?",
  hearing: "Welcome to FanPulse Access! 📝 I'm set up for text-first communication — no audio reliance. All directions and alerts will be visual and text-based. What can I help you with?",
  cognitive: "Welcome to FanPulse Access.\n\nI am your stadium helper.\n\nI use short, clear sentences.\n\nAsk me one question at a time.\n\nI will help you find your way.",
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useChat() {
  const { profileId } = useProfile()
  const [messages, setMessages] = useState(() => {
    const welcome = WELCOME_MESSAGES[profileId] || WELCOME_MESSAGES.standard
    return [createMessage('assistant', welcome, profileId)]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Send a message through the full security pipeline → chatService.
   *
   * @param {string} rawText – The raw user input from the text field.
   * @returns {Promise<void>}
   */
  const sendMessage = useCallback(async (rawText) => {
    setError(null)

    // ── Step 1: Sanitize ──
    const { clean, wasTruncated } = sanitizeInput(rawText, 'chat')
    if (!clean.trim()) return // Ignore empty messages

    // ── Step 2: PII stripping ──
    const { cleaned: safeText, redactions } = stripPII(clean)
    if (redactions.length > 0) {
      console.info('[useChat] PII redacted from user message:', redactions)
    }

    // ── Step 3: Rate limit check ──
    if (!chatRateLimiter.tryConsume()) {
      const waitSec = Math.ceil(chatRateLimiter.getWaitTimeMs() / 1000)
      setError(`You're sending messages too quickly. Please wait ${waitSec}s.`)
      return
    }

    // ── Step 4: Add user message to state ──
    const userMsg = createMessage('user', safeText, profileId)
    setMessages(prev => [...prev, userMsg])

    if (wasTruncated) {
      const sysMsg = createMessage('system', 'Your message was trimmed to 500 characters.')
      setMessages(prev => [...prev, sysMsg])
    }

    // ── Step 5: Call Gemini via chatService ──
    setIsLoading(true)
    try {
      // Build history from existing messages (exclude the one we just added)
      const history = toGeminiHistory([...messages, userMsg].slice(0, -1))

      const responseText = await sendChatMessage(safeText, profileId, history)

      const assistantMsg = createMessage('assistant', responseText, profileId)
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      console.error('[useChat] Gemini call failed:', err)
      const errorMsg = createMessage(
        'system',
        err.message || 'Something went wrong. Please try again.'
      )
      setMessages(prev => [...prev, errorMsg])
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [messages, profileId])

  /**
   * Clear the conversation and show a fresh welcome message.
   */
  const clearChat = useCallback(() => {
    const welcome = WELCOME_MESSAGES[profileId] || WELCOME_MESSAGES.standard
    setMessages([createMessage('assistant', welcome, profileId)])
    setError(null)
    chatRateLimiter.reset()
  }, [profileId])

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    isAvailable: isChatAvailable(),
  }
}
