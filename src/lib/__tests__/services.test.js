import { describe, it, expect } from 'vitest'
import { getWeatherDescription, truncateAtSentence } from '../services.js'

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
      const sentence1 = 'Alan Turing was an English mathematician and computer scientist who made foundational contributions to theoretical biology.'
      const sentence2 = ' He played a pivotal role in cracking intercepted coded messages during the Second World War at Bletchley Park.'
      const sentence3 = ' His work on the Turing machine provided a blueprint for modern stored-program digital computers across the globe.'
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
  })
})
