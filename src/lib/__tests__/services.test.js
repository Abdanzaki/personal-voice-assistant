import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getWeatherDescription,
  truncateAtSentence,
  fetchWikipediaSummary,
  fetchWeather,
} from '../services.js'

describe('services pure helpers', () => {
  describe('getWeatherDescription', () => {
    it('maps WMO code 0 to clear skies', () => {
      expect(getWeatherDescription(0)).toBe('clear skies')
    })

    it('maps WMO code 1 to mainly clear skies', () => {
      expect(getWeatherDescription(1)).toBe('mainly clear skies')
    })

    it('maps WMO code 2 to partly cloudy skies', () => {
      expect(getWeatherDescription(2)).toBe('partly cloudy skies')
    })

    it('maps WMO code 3 to overcast skies', () => {
      expect(getWeatherDescription(3)).toBe('overcast skies')
    })

    it('maps fog codes 45 and 48', () => {
      expect(getWeatherDescription(45)).toBe('foggy conditions')
      expect(getWeatherDescription(48)).toBe('foggy conditions')
    })

    it('maps rain codes', () => {
      expect(getWeatherDescription(61)).toBe('light rain')
      expect(getWeatherDescription(63)).toBe('moderate rain')
      expect(getWeatherDescription(65)).toBe('heavy rain')
    })

    it('maps snow codes', () => {
      expect(getWeatherDescription(71)).toBe('light snow')
    })

    it('maps thunderstorm codes', () => {
      expect(getWeatherDescription(95)).toBe('thunderstorms')
      expect(getWeatherDescription(96)).toBe('thunderstorms with hail')
    })

    it('falls back to default description for unknown code', () => {
      expect(getWeatherDescription(9999)).toBe('clear skies')
    })
  })

  describe('truncateAtSentence', () => {
    it('returns short text unmodified', () => {
      const short = 'This is a short summary under 350 characters.'
      expect(truncateAtSentence(short, 350)).toBe(short)
    })

    it('truncates cleanly at a sentence boundary within maxLength', () => {
      const sentence1 =
        'Alan Turing was an English mathematician and computer scientist who made foundational contributions to theoretical biology.'
      const sentence2 =
        ' He played a pivotal role in cracking intercepted coded messages during the Second World War at Bletchley Park.'
      const sentence3 =
        ' His work on the Turing machine provided a blueprint for modern stored-program digital computers across the globe.'
      const text = sentence1 + sentence2 + sentence3

      const truncated = truncateAtSentence(text, 250)
      expect(truncated.endsWith('.')).toBe(true)
      expect(truncated.length).toBeLessThanOrEqual(250)
      expect(truncated).toContain(sentence1)
      expect(truncated).toContain(sentence2.trim())
      expect(truncated).not.toContain(sentence3)
    })

    it('falls back to word boundary with ellipsis if no sentence boundary is present', () => {
      const longRunOn = 'A'.repeat(50) + ' ' + 'B'.repeat(50) + ' ' + 'C'.repeat(50)
      const truncated = truncateAtSentence(longRunOn, 80)
      expect(truncated.endsWith('...')).toBe(true)
      expect(truncated.length).toBeLessThanOrEqual(80)
    })

    it('handles empty or null text safely', () => {
      expect(truncateAtSentence('')).toBe('')
      expect(truncateAtSentence(null)).toBe('')
      expect(truncateAtSentence(undefined)).toBe('')
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
