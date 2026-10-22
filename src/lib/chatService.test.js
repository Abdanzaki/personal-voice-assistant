import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  sendChatMessage,
} from './chatService.js'

describe('chatService.js', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  describe('getApiBaseUrl', () => {
    it('returns default base URL if VITE_API_BASE_URL is not set', () => {
      const url = getApiBaseUrl()
      expect(url).toBe(DEFAULT_API_BASE_URL)
    })
  })

  describe('sendChatMessage', () => {
    it('successfully posts message and returns data when backend responds', async () => {
      const mockResponseData = {
        reply: 'Artificial intelligence is the simulation of human intelligence.',
        ai_configured: true,
      }

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData,
      })

      const result = await sendChatMessage('What is artificial intelligence?')

      expect(globalThis.fetch).toHaveBeenCalledTimes(1)
      const [url, options] = globalThis.fetch.mock.calls[0]
      expect(url).toBe('http://localhost:8000/api/chat')
      expect(options.method).toBe('POST')
      expect(options.headers['Content-Type']).toBe('application/json')
      expect(JSON.parse(options.body)).toEqual({
        message: 'What is artificial intelligence?',
      })
      expect(result).toEqual(mockResponseData)
    })

    it('supports custom base URL with or without trailing slash', async () => {
      const mockResponseData = {
        reply: 'Custom base response',
        ai_configured: true,
      }

      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseData,
      })

      const result = await sendChatMessage('Hi', 'http://127.0.0.1:8000/')
      const [url] = globalThis.fetch.mock.calls[0]
      expect(url).toBe('http://127.0.0.1:8000/api/chat')
      expect(result).toEqual(mockResponseData)
    })

    it('throws error when server responds with non-ok status', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await expect(sendChatMessage('Broken request')).rejects.toThrow(
        'Backend returned status 500'
      )
    })

    it('propagates network failure (backend unreachable)', async () => {
      globalThis.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(sendChatMessage('Unreachable')).rejects.toThrow(
        'Failed to fetch'
      )
    })
  })
})
