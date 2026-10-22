import { describe, it, expect } from 'vitest'
import { extractWakeCommand } from '../wakeWord.js'
import { extractWakeCommand as extractFromRouter } from '../commandRouter.js'
import { ASSISTANT_NAME } from '../../config.js'

describe('extractWakeCommand', () => {
  it('is exported from both wakeWord.js and commandRouter.js', () => {
    expect(typeof extractWakeCommand).toBe('function')
    expect(typeof extractFromRouter).toBe('function')
  })

  describe('wake at start', () => {
    it("extracts command when wake word is at start with comma ('Jarvis, what is the time')", () => {
      const res = extractWakeCommand('Jarvis, what is the time')
      expect(res).toEqual({ woke: true, command: 'what is the time' })
    })

    it("extracts command when wake word is at start without comma ('Jarvis what is the date')", () => {
      const res = extractWakeCommand('Jarvis what is the date')
      expect(res).toEqual({ woke: true, command: 'what is the date' })
    })

    it("extracts command with colon ('Jarvis: open YouTube')", () => {
      const res = extractWakeCommand('Jarvis: open YouTube')
      expect(res).toEqual({ woke: true, command: 'open YouTube' })
    })
  })

  describe('wake at middle or end', () => {
    it("extracts command when wake word is in the middle ('tell me, Jarvis, what is the time')", () => {
      const res = extractWakeCommand('tell me, Jarvis, what is the time')
      expect(res).toEqual({ woke: true, command: 'tell me what is the time' })
    })

    it("extracts command when wake word is in the middle without commas ('please Jarvis open github')", () => {
      const res = extractWakeCommand('please Jarvis open github')
      expect(res).toEqual({ woke: true, command: 'please open github' })
    })

    it("extracts command when wake word is at the end ('what is the time, Jarvis?')", () => {
      const res = extractWakeCommand('what is the time, Jarvis?')
      expect(res).toEqual({ woke: true, command: 'what is the time' })
    })

    it("extracts command when wake word is at the end without punctuation ('tell me a joke Jarvis')", () => {
      const res = extractWakeCommand('tell me a joke Jarvis')
      expect(res).toEqual({ woke: true, command: 'tell me a joke' })
    })
  })

  describe('no wake word', () => {
    it("returns woke: false when wake word is not present ('what is the time')", () => {
      const res = extractWakeCommand('what is the time')
      expect(res.woke).toBe(false)
      expect(res.command).toBe('')
    })

    it("returns woke: false for unrelated phrases ('open Google')", () => {
      const res = extractWakeCommand('open Google')
      expect(res.woke).toBe(false)
      expect(res.command).toBe('')
    })

    it("does not trigger on substrings of other words ('Jarvisian hypothesis')", () => {
      const res = extractWakeCommand('Jarvisian hypothesis')
      expect(res.woke).toBe(false)
    })
  })

  describe('bare wake word', () => {
    it("returns woke: true and empty command for bare wake word ('Jarvis')", () => {
      const res = extractWakeCommand('Jarvis')
      expect(res).toEqual({ woke: true, command: '' })
    })

    it("returns woke: true and empty command with leading/trailing whitespace ('   Jarvis   ')", () => {
      const res = extractWakeCommand('   Jarvis   ')
      expect(res).toEqual({ woke: true, command: '' })
    })

    it("returns woke: true and empty command with exclamation mark ('Jarvis!')", () => {
      const res = extractWakeCommand('Jarvis!')
      expect(res).toEqual({ woke: true, command: '' })
    })

    it("returns woke: true and empty command with dots ('...jarvis...')", () => {
      const res = extractWakeCommand('...jarvis...')
      expect(res).toEqual({ woke: true, command: '' })
    })
  })

  describe('case and punctuation variants', () => {
    it("handles lowercase wake word ('jarvis, tell me a joke')", () => {
      const res = extractWakeCommand('jarvis, tell me a joke')
      expect(res).toEqual({ woke: true, command: 'tell me a joke' })
    })

    it("handles all-caps wake word ('JARVIS: what is 12 times 8')", () => {
      const res = extractWakeCommand('JARVIS: what is 12 times 8')
      expect(res).toEqual({ woke: true, command: 'what is 12 times 8' })
    })

    it("handles mixed case ('JaRvIs, weather in Paris')", () => {
      const res = extractWakeCommand('JaRvIs, weather in Paris')
      expect(res).toEqual({ woke: true, command: 'weather in Paris' })
    })
  })

  describe('custom wake words and edge cases', () => {
    it('supports custom wake words passed as second argument', () => {
      const res = extractWakeCommand('Alexa, what is the weather', 'Alexa')
      expect(res).toEqual({ woke: true, command: 'what is the weather' })
    })

    it('handles empty string safely', () => {
      const res = extractWakeCommand('')
      expect(res).toEqual({ woke: false, command: '' })
    })

    it('handles null or undefined input safely', () => {
      expect(extractWakeCommand(null)).toEqual({ woke: false, command: '' })
      expect(extractWakeCommand(undefined)).toEqual({ woke: false, command: '' })
      expect(extractWakeCommand(123)).toEqual({ woke: false, command: '' })
    })

    it('handles missing or empty wake word safely', () => {
      expect(extractWakeCommand('Jarvis', '')).toEqual({ woke: false, command: '' })
      expect(extractWakeCommand('Jarvis', null)).toEqual({ woke: false, command: '' })
    })
  })
})
