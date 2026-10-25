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
    it("extracts command when wake word is at start with comma ('Captain, what is the time')", () => {
      const res = extractWakeCommand('Captain, what is the time')
      expect(res).toEqual({ woke: true, command: 'what is the time' })
    })

    it("extracts command when wake word is at start without comma ('Captain what is the date')", () => {
      const res = extractWakeCommand('Captain what is the date')
      expect(res).toEqual({ woke: true, command: 'what is the date' })
    })

    it("extracts command with colon ('Captain: open YouTube')", () => {
      const res = extractWakeCommand('Captain: open YouTube')
      expect(res).toEqual({ woke: true, command: 'open YouTube' })
    })
  })

  describe('wake at middle or end', () => {
    it("extracts command when wake word is in the middle ('tell me, Captain, what is the time')", () => {
      const res = extractWakeCommand('tell me, Captain, what is the time')
      expect(res).toEqual({ woke: true, command: 'tell me what is the time' })
    })

    it("extracts command when wake word is in the middle without commas ('please Captain open github')", () => {
      const res = extractWakeCommand('please Captain open github')
      expect(res).toEqual({ woke: true, command: 'please open github' })
    })

    it("extracts command when wake word is at the end ('what is the time, Captain?')", () => {
      const res = extractWakeCommand('what is the time, Captain?')
      expect(res).toEqual({ woke: true, command: 'what is the time' })
    })

    it("extracts command when wake word is at the end without punctuation ('tell me a joke Captain')", () => {
      const res = extractWakeCommand('tell me a joke Captain')
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

    it("does not trigger on substrings of other words ('Captainian hypothesis')", () => {
      const res = extractWakeCommand('Captainian hypothesis')
      expect(res.woke).toBe(false)
    })
  })

  describe('bare wake word', () => {
    it("returns woke: true and empty command for bare wake word ('Captain')", () => {
      const res = extractWakeCommand('Captain')
      expect(res).toEqual({ woke: true, command: '' })
    })

    it("returns woke: true and empty command with leading/trailing whitespace ('   Captain   ')", () => {
      const res = extractWakeCommand('   Captain   ')
      expect(res).toEqual({ woke: true, command: '' })
    })

    it("returns woke: true and empty command with exclamation mark ('Captain!')", () => {
      const res = extractWakeCommand('Captain!')
      expect(res).toEqual({ woke: true, command: '' })
    })

    it("returns woke: true and empty command with dots ('...captain...')", () => {
      const res = extractWakeCommand('...captain...')
      expect(res).toEqual({ woke: true, command: '' })
    })
  })

  describe('case and punctuation variants', () => {
    it("handles lowercase wake word ('captain, tell me a joke')", () => {
      const res = extractWakeCommand('captain, tell me a joke')
      expect(res).toEqual({ woke: true, command: 'tell me a joke' })
    })

    it("handles all-caps wake word ('CAPTAIN: what is 12 times 8')", () => {
      const res = extractWakeCommand('CAPTAIN: what is 12 times 8')
      expect(res).toEqual({ woke: true, command: 'what is 12 times 8' })
    })

    it("handles mixed case ('CaPtAiN, weather in Paris')", () => {
      const res = extractWakeCommand('CaPtAiN, weather in Paris')
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
      expect(extractWakeCommand('Captain', '')).toEqual({ woke: false, command: '' })
      expect(extractWakeCommand('Captain', null)).toEqual({ woke: false, command: '' })
    })
  })
})
