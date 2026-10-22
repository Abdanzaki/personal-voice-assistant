import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  truncateAtSentence,
  getWeatherDescription,
  fetchWikipediaSummary,
  fetchWeather,
} from './services.js'

describe('services.js', () => {
  describe('truncateAtSentence', () => {
    it('returns short text unchanged', () => {
      expect(truncateAtSentence('Short sentence.')).toBe('Short sentence.')
    })

    it('truncates cleanly at a sentence boundary within maxLength', () => {
      const longText =
        'Albert Einstein was a German-born theoretical physicist who is widely held to be one of the greatest and most influential scientists of all time. Best known for developing the theory of relativity, he also made important contributions to quantum mechanics. He received the 1921 Nobel Prize in Physics for his services to theoretical physics.'
      const truncated = truncateAtSentence(longText, 200)
      expect(truncated.endsWith('.')).toBe(true)
      expect(truncated.length).toBeLessThanOrEqual(200)
    })

    it('handles empty or null text safely', () => {
      expect(truncateAtSentence('')).toBe('')
      expect(truncateAtSentence(null)).toBe('')
    })
  })

  describe('getWeatherDescription', () => {
    it('maps known WMO weather codes to spoken descriptions', () => {
      expect(getWeatherDescription(0)).toBe('clear skies')
      expect(getWeatherDescription(1)).toBe('mainly clear skies')
      expect(getWeatherDescription(2)).toBe('partly cloudy skies')
      expect(getWeatherDescription(3)).toBe('overcast skies')
      expect(getWeatherDescription(61)).toBe('light rain')
      expect(getWeatherDescription(71)).toBe('light snow')
      expect(getWeatherDescription(95)).toBe('thunderstorms')
    })

    it('defaults unknown codes to clear skies', () => {
      expect(getWeatherDescription(9999)).toBe('clear skies')
    })
  })

  describe('fetchWikipediaSummary', () => {
    const originalFetch = globalThis.fetch

    beforeEach(() => {
      globalThis.fetch = vi.fn()
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('returns prompt for empty topic', async () => {
      const res = await fetchWikipediaSummary('')
      expect(res).toBe('Please specify a topic to look up on Wikipedia.')
    })

    it('returns introductory summary when topic is found', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'standard',
          extract:
            'Alan Turing was an English mathematician, computer scientist, logician, cryptanalyst, philosopher, and theoretical biologist.',
        }),
      })

      const res = await fetchWikipediaSummary('Alan Turing')
      expect(res).toContain('Alan Turing was an English mathematician')
    })

    it('handles missing pages or 404 gracefully', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const res = await fetchWikipediaSummary('UnknownTopicXYZ123')
      expect(res).toBe('I couldn\'t find anything on Wikipedia for "UnknownTopicXYZ123".')
    })

    it('handles network failure gracefully', async () => {
      globalThis.fetch.mockRejectedValueOnce(new Error('Network error'))

      const res = await fetchWikipediaSummary('NetworkFailTopic')
      expect(res).toBe('I couldn\'t find anything on Wikipedia for "NetworkFailTopic".')
    })
  })

  describe('fetchWeather', () => {
    const originalFetch = globalThis.fetch

    beforeEach(() => {
      globalThis.fetch = vi.fn()
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('fetches coordinates and current forecast successfully', async () => {
      // Mock geocoding API response
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            {
              name: 'Paris',
              latitude: 48.85,
              longitude: 2.35,
            },
          ],
        }),
      })

      // Mock weather forecast API response
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 21.4,
            apparent_temperature: 22.1,
            relative_humidity_2m: 55,
            weather_code: 0,
            wind_speed_10m: 12.3,
          },
        }),
      })

      const res = await fetchWeather('Paris')
      expect(res).toContain('In Paris it is currently 21 degrees Celsius with clear skies')
      expect(res).toContain('feels like 22 degrees')
      expect(res).toContain('humidity is 55 percent')
    })

    it('handles unknown city gracefully', async () => {
      globalThis.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [],
        }),
      })

      const res = await fetchWeather('NonExistentCityNameXYZ')
      expect(res).toBe('I couldn\'t find weather information for "NonExistentCityNameXYZ".')
    })

    it('handles network failure gracefully', async () => {
      globalThis.fetch.mockRejectedValueOnce(new Error('Connection lost'))

      const res = await fetchWeather('Tokyo')
      expect(res).toBe('Sorry, I could not retrieve the weather for "Tokyo" right now.')
    })
  })
})
