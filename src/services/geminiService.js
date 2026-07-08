/**
 * geminiService.js
 * 
 * Centralized wrapper around the Google Generative AI SDK.
 * - Reads the API key from Vite environment variables (never hardcoded).
 * - Provides a single `generateResponse` function consumed by chatService.
 * - Handles initialization errors gracefully so the rest of the app
 *   can degrade to offline mode if no key is present.
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

let genAI = null
let model = null

/**
 * Lazily initialize the SDK.  Throws a clear error when the key is
 * missing so callers can surface a user-friendly fallback.
 */
function getModel() {
  if (model) return model

  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    throw new Error(
      'VITE_GEMINI_API_KEY is not configured. ' +
      'Copy .env.example to .env and add your Gemini API key.'
    )
  }

  genAI = new GoogleGenerativeAI(API_KEY)
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  return model
}

/**
 * Generate a response from Gemini.
 *
 * @param {string}   systemPrompt  – profile-adapted system instruction
 * @param {string}   userMessage   – the fan's (sanitized) message
 * @param {object[]} history       – prior turns [{role,parts}]
 * @param {string}   [context]     – optional stadium-data context blob
 * @returns {Promise<string>}        the model's text response
 */
export async function generateResponse(
  systemPrompt,
  userMessage,
  history = [],
  context = ''
) {
  const m = getModel()

  const chat = m.startChat({
    systemInstruction: {
      role: 'system',
      parts: [{ text: systemPrompt }],
    },
    history: history.map((h) => ({
      role: h.role,
      parts: [{ text: h.parts }],
    })),
  })

  const prompt = context
    ? `Context about the stadium:\n${context}\n\nFan question: ${userMessage}`
    : userMessage

  const result = await chat.sendMessage(prompt)
  const response = await result.response
  return response.text()
}

/**
 * Quick health-check: returns true if the SDK can be initialized.
 */
export function isGeminiAvailable() {
  try {
    getModel()
    return true
  } catch {
    return false
  }
}
