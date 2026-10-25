/**
 * Service to communicate with the Captain FastAPI backend AI fallback endpoint.
 */

export const DEFAULT_API_BASE_URL = 'http://localhost:8000'

/**
 * Resolves the backend API base URL from Vite environment or default.
 *
 * @returns {string} The base URL for the backend API.
 */
export function getApiBaseUrl() {
  if (
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL
  ) {
    return import.meta.env.VITE_API_BASE_URL
  }
  return DEFAULT_API_BASE_URL
}

/**
 * Sends a message to the backend AI chat endpoint.
 *
 * @param {string} message - The raw user message text.
 * @param {string} [baseUrl] - Optional custom base URL.
 * @returns {Promise<{ reply: string, ai_configured: boolean, error?: boolean }>}
 */
export async function sendChatMessage(message, baseUrl) {
  const base = baseUrl || getApiBaseUrl()
  const cleanBase = base.replace(/\/+$/, '')
  const url = `${cleanBase}/api/chat`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    throw new Error(`Backend returned status ${response.status}`)
  }

  return await response.json()
}
