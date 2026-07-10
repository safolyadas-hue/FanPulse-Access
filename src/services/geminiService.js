/**
 * geminiService.js
 * 
 * Centralized wrapper around the AI backend proxy.
 * - Makes POST requests to the Netlify serverless function.
 * - Provides a single `generateResponse` function consumed by chatService.
 * - No longer exposes the Gemini API key to the client.
 */

/**
 * Generate a response from Gemini via backend proxy.
 *
 * @param {string}   profileId     – the active profile ID
 * @param {string}   userMessage   – the fan's (sanitized) message
 * @param {object[]} history       – prior turns [{role,parts}]
 * @param {string}   [context]     – optional stadium-data context blob
 * @returns {Promise<string>}        the model's text response
 */
export async function generateResponse(
  profileId,
  userMessage,
  history = [],
  context = ''
) {
  try {
    const response = await fetch('/.netlify/functions/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileId,
        userMessage,
        history,
        context
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error in geminiService:', error);
    throw error;
  }
}

/**
 * Quick health-check: returns true since availability is now handled by the server.
 */
export function isGeminiAvailable() {
  return true;
}
