import { describe, it, expect } from 'vitest'
import { routeCommand, SITE_MAP, JOKES, normalizeText } from './commandRouter.js'
import { ASSISTANT_NAME } from '../config.js'

describe('commandRouter.js', () => {
  describe('normalizeText helper', () => {
    it('lowercases and strips punctuation', () => {
      expect(normalizeText('Hello, World!')).toBe('hello world')
      expect(normalizeText('   What   is   time?   ')).toBe('what is time')
    })

    it('handles empty or non-string inputs safely', () => {
      expect(normalizeText('')).toBe('')
      expect(normalizeText(null)).toBe('')
      expect(normalizeText(undefined)).toBe('')
    })
  })

  describe('Phase 1 Commands Regression', () => {
    it('routes greetings appropriately', () => {
      const inputs = ['hello', 'hi', 'hey', 'good morning', `hey ${ASSISTANT_NAME}`, ASSISTANT_NAME]
      for (const text of inputs) {
        const result = routeCommand(text)
        expect(result.action.type).toBe('greeting')
        expect(result.reply).toContain(ASSISTANT_NAME)
      }
    })

    it('routes time commands', () => {
      const inputs = ['what time is it', 'tell me the time', 'current time', 'what is the time']
      for (const text of inputs) {
        const result = routeCommand(text)
        expect(result.action.type).toBe('time')
        expect(result.action.timestamp).toBeDefined()
        expect(result.reply).toMatch(/The current time is \d+:\d+/)
      }
    })

    it('routes date commands', () => {
      const inputs = ["what is the date", "what day is it", "today's date", "what is today's date"]
      for (const text of inputs) {
        const result = routeCommand(text)
        expect(result.action.type).toBe('date')
        expect(result.action.timestamp).toBeDefined()
        expect(result.reply).toContain('Today is')
      }
    })

    it('routes joke commands and returns a joke from the bank', () => {
      const inputs = ['tell me a joke', 'make me laugh', 'give me a joke']
      for (const text of inputs) {
        const result = routeCommand(text)
        expect(result.action.type).toBe('joke')
        expect(JOKES).toContain(result.reply)
      }
    })

    it('routes name/identity commands', () => {
      const inputs = ['what is your name', 'who are you', "what's your name"]
      for (const text of inputs) {
        const result = routeCommand(text)
        expect(result.action.type).toBe('name')
        expect(result.reply).toContain(ASSISTANT_NAME)
      }
    })

    it('routes unknown queries to unknown action with reply null', () => {
      const result = routeCommand('xyz123 completely random gibberish phrase')
      expect(result.reply).toBeNull()
      expect(result.action.type).toBe('unknown')
      expect(result.action.query).toBe('xyz123 completely random gibberish phrase')
    })

    it('handles empty input gracefully', () => {
      expect(routeCommand('')).toEqual({ reply: null, action: { type: 'unknown' } })
      expect(routeCommand('   ')).toEqual({ reply: null, action: { type: 'unknown' } })
      expect(routeCommand(null)).toEqual({ reply: null, action: { type: 'unknown' } })
    })
  })

  describe('Open Websites Intent', () => {
    it('defines a site map containing all 14 requested websites', () => {
      const expectedSites = [
        'youtube',
        'google',
        'github',
        'gmail',
        'twitter',
        'x',
        'instagram',
        'linkedin',
        'reddit',
        'amazon',
        'wikipedia',
        'netflix',
        'spotify',
        'stack overflow',
      ]
      for (const site of expectedSites) {
        expect(SITE_MAP[site]).toBeDefined()
        expect(SITE_MAP[site].name).toBeTruthy()
        expect(SITE_MAP[site].url).toMatch(/^https?:\/\//)
      }
    })

    it('routes open commands for all mapped websites', () => {
      const cases = [
        { input: 'open youtube', name: 'YouTube', url: 'https://www.youtube.com' },
        { input: 'open google', name: 'Google', url: 'https://www.google.com' },
        { input: 'open github', name: 'GitHub', url: 'https://github.com' },
        { input: 'open gmail', name: 'Gmail', url: 'https://mail.google.com' },
        { input: 'open twitter', name: 'Twitter', url: 'https://twitter.com' },
        { input: 'open x', name: 'X', url: 'https://x.com' },
        { input: 'open instagram', name: 'Instagram', url: 'https://www.instagram.com' },
        { input: 'open linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com' },
        { input: 'open reddit', name: 'Reddit', url: 'https://www.reddit.com' },
        { input: 'open amazon', name: 'Amazon', url: 'https://www.amazon.com' },
        { input: 'open wikipedia', name: 'Wikipedia', url: 'https://www.wikipedia.org' },
        { input: 'open netflix', name: 'Netflix', url: 'https://www.netflix.com' },
        { input: 'open spotify', name: 'Spotify', url: 'https://open.spotify.com' },
        { input: 'open stack overflow', name: 'Stack Overflow', url: 'https://stackoverflow.com' },
        { input: 'open stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com' },
      ]

      for (const { input, name, url } of cases) {
        const res = routeCommand(input)
        expect(res.reply).toBe(`Opening ${name}`)
        expect(res.action).toEqual({ type: 'open-url', url })
      }
    })

    it('works with wake word prefix', () => {
      const res = routeCommand('hey jarvis open github')
      expect(res.reply).toBe('Opening GitHub')
      expect(res.action).toEqual({ type: 'open-url', url: 'https://github.com' })
    })
  })

  describe('Google Search Intent', () => {
    it("handles 'search for <q>'", () => {
      const res = routeCommand('search for quantum computing')
      expect(res.reply).toBe('Searching Google for quantum computing')
      expect(res.action).toEqual({
        type: 'open-url',
        url: 'https://www.google.com/search?q=quantum%20computing',
      })
    })

    it("handles 'google <q>'", () => {
      const res = routeCommand('google react 19 tutorials')
      expect(res.reply).toBe('Searching Google for react 19 tutorials')
      expect(res.action).toEqual({
        type: 'open-url',
        url: 'https://www.google.com/search?q=react%2019%20tutorials',
      })
    })

    it("handles 'search google for <q>'", () => {
      const res = routeCommand('search google for vitest documentation')
      expect(res.reply).toBe('Searching Google for vitest documentation')
      expect(res.action).toEqual({
        type: 'open-url',
        url: 'https://www.google.com/search?q=vitest%20documentation',
      })
    })
  })

  describe('YouTube Intent', () => {
    it("handles 'play <q> on youtube'", () => {
      const res = routeCommand('play bohemian rhapsody on youtube')
      expect(res.reply).toBe('Playing bohemian rhapsody on YouTube')
      expect(res.action).toEqual({
        type: 'open-url',
        url: 'https://www.youtube.com/results?search_query=bohemian%20rhapsody',
      })
    })

    it("handles 'youtube <q>'", () => {
      const res = routeCommand('youtube lofi hip hop')
      expect(res.reply).toBe('Searching YouTube for lofi hip hop')
      expect(res.action).toEqual({
        type: 'open-url',
        url: 'https://www.youtube.com/results?search_query=lofi%20hip%20hop',
      })
    })

    it("handles 'search youtube for <q>'", () => {
      const res = routeCommand('search youtube for jazz music')
      expect(res.reply).toBe('Searching YouTube for jazz music')
      expect(res.action).toEqual({
        type: 'open-url',
        url: 'https://www.youtube.com/results?search_query=jazz%20music',
      })
    })
  })

  describe('Wikipedia Intent', () => {
    it("handles 'who is <topic>'", () => {
      const res = routeCommand('who is Albert Einstein')
      expect(res.reply).toBeNull()
      expect(res.action).toEqual({ type: 'wikipedia', query: 'Albert Einstein' })
    })

    it("handles 'what is <topic>' for non-math queries", () => {
      const res = routeCommand('what is quantum computing')
      expect(res.reply).toBeNull()
      expect(res.action).toEqual({ type: 'wikipedia', query: 'quantum computing' })
    })

    it("handles 'tell me about <topic>'", () => {
      const res = routeCommand('tell me about Mars')
      expect(res.reply).toBeNull()
      expect(res.action).toEqual({ type: 'wikipedia', query: 'Mars' })
    })

    it("handles 'wikipedia <topic>'", () => {
      const res = routeCommand('wikipedia Alan Turing')
      expect(res.reply).toBeNull()
      expect(res.action).toEqual({ type: 'wikipedia', query: 'Alan Turing' })
    })

    it("handles 'look up <topic> on wikipedia'", () => {
      const res = routeCommand('look up Marie Curie on wikipedia')
      expect(res.reply).toBeNull()
      expect(res.action).toEqual({ type: 'wikipedia', query: 'Marie Curie' })
    })
  })

  describe('Weather Intent', () => {
    it("handles 'weather in <city>'", () => {
      const res = routeCommand('weather in Paris')
      expect(res.reply).toBeNull()
      expect(res.action).toEqual({ type: 'weather', city: 'Paris' })
    })

    it("handles 'what is the weather in <city>'", () => {
      const res = routeCommand('what is the weather in Tokyo')
      expect(res.reply).toBeNull()
      expect(res.action).toEqual({ type: 'weather', city: 'Tokyo' })
    })

    it("handles 'how is the weather in <city>'", () => {
      const res = routeCommand('how is the weather in London')
      expect(res.reply).toBeNull()
      expect(res.action).toEqual({ type: 'weather', city: 'London' })
    })

    it("defaults to 'Hyderabad' when no city is specified", () => {
      const res1 = routeCommand('weather')
      expect(res1.reply).toBeNull()
      expect(res1.action).toEqual({ type: 'weather', city: 'Hyderabad' })

      const res2 = routeCommand('what is the weather')
      expect(res2.reply).toBeNull()
      expect(res2.action).toEqual({ type: 'weather', city: 'Hyderabad' })

      const res3 = routeCommand('how is the weather')
      expect(res3.reply).toBeNull()
      expect(res3.action).toEqual({ type: 'weather', city: 'Hyderabad' })
    })
  })

  describe('Calculator Intent', () => {
    it("handles 'calculate <expr>'", () => {
      const res = routeCommand('calculate 12 * 8')
      expect(res.reply).toBe('12 times 8 is 96')
      expect(res.action).toEqual({
        type: 'calculate',
        result: 96,
        expression: '12 * 8',
      })
    })

    it("handles 'what is <expr-with-numbers>'", () => {
      const res = routeCommand('what is 4 plus 5')
      expect(res.reply).toBe('4 plus 5 is 9')
      expect(res.action).toEqual({
        type: 'calculate',
        result: 9,
        expression: '4 plus 5',
      })
    })

    it('handles bare arithmetic expressions with symbols', () => {
      const res = routeCommand('12 * 8')
      expect(res.reply).toBe('12 times 8 is 96')
      expect(res.action.type).toBe('calculate')
      expect(res.action.result).toBe(96)
    })

    it('handles float noise elimination: 0.1+0.2 must answer 0.3', () => {
      const res1 = routeCommand('0.1 + 0.2')
      expect(res1.reply).toBe('0.1 plus 0.2 is 0.3')
      expect(res1.action.result).toBe(0.3)

      const res2 = routeCommand('what is 0.1 plus 0.2')
      expect(res2.reply).toBe('0.1 plus 0.2 is 0.3')
      expect(res2.action.result).toBe(0.3)
    })

    it('handles division by zero with friendly reply', () => {
      const res1 = routeCommand('10 / 0')
      expect(res1.reply).toBe('Cannot divide by zero.')
      expect(res1.action).toEqual({
        type: 'calculate',
        error: 'division-by-zero',
        expression: '10 / 0',
      })

      const res2 = routeCommand('calculate 5 divided by 0')
      expect(res2.reply).toBe('Cannot divide by zero.')
      expect(res2.action).toEqual({
        type: 'calculate',
        error: 'division-by-zero',
        expression: '5 divided by 0',
      })
    })

    it('handles word operators (multiplied by, divided by, times, plus, minus)', () => {
      const res1 = routeCommand('6 multiplied by 7')
      expect(res1.reply).toBe('6 multiplied by 7 is 42')
      expect(res1.action.result).toBe(42)

      const res2 = routeCommand('100 divided by 4')
      expect(res2.reply).toBe('100 divided by 4 is 25')
      expect(res2.action.result).toBe(25)
    })
  })

  describe('Controls Intent', () => {
    it("handles 'stop' / 'stop speaking' / 'be quiet' -> stop-speaking", () => {
      const inputs = ['stop', 'stop speaking', 'be quiet', 'hey jarvis stop', 'jarvis be quiet']
      for (const text of inputs) {
        const res = routeCommand(text)
        expect(res.reply).toBeNull()
        expect(res.action).toEqual({ type: 'stop-speaking' })
      }
    })

    it("handles 'repeat that' / 'say that again' / 'repeat' -> repeat", () => {
      const inputs = ['repeat', 'repeat that', 'say that again', 'hey jarvis repeat that']
      for (const text of inputs) {
        const res = routeCommand(text)
        expect(res.reply).toBeNull()
        expect(res.action).toEqual({ type: 'repeat' })
      }
    })
  })

  describe('Intent Ordering Regressions (Critical)', () => {
    it("'what is the time' routes to TIME (not calculator or wikipedia)", () => {
      const res = routeCommand('what is the time')
      expect(res.action.type).toBe('time')
      expect(res.reply).toContain('The current time is')
    })

    it("'what is the date' routes to DATE (not calculator or wikipedia)", () => {
      const res = routeCommand('what is the date')
      expect(res.action.type).toBe('date')
      expect(res.reply).toContain('Today is')
    })

    it("'what is 4 plus 5' routes to CALCULATOR (not wikipedia)", () => {
      const res = routeCommand('what is 4 plus 5')
      expect(res.action.type).toBe('calculate')
      expect(res.action.result).toBe(9)
      expect(res.reply).toBe('4 plus 5 is 9')
    })

    it("'what is the weather in Paris' routes to WEATHER (not wikipedia)", () => {
      const res = routeCommand('what is the weather in Paris')
      expect(res.action.type).toBe('weather')
      expect(res.action.city).toBe('Paris')
    })

    it("'what is artificial intelligence' routes to WIKIPEDIA (since not math, weather, or time)", () => {
      const res = routeCommand('what is artificial intelligence')
      expect(res.action.type).toBe('wikipedia')
      expect(res.action.query).toBe('artificial intelligence')
    })

    it("'open wikipedia' routes to OPEN WEBSITES (not wikipedia search)", () => {
      const res = routeCommand('open wikipedia')
      expect(res.action.type).toBe('open-url')
      expect(res.action.url).toBe('https://www.wikipedia.org')
      expect(res.reply).toBe('Opening Wikipedia')
    })

    it("'open google' routes to OPEN WEBSITES (not google search)", () => {
      const res = routeCommand('open google')
      expect(res.action.type).toBe('open-url')
      expect(res.action.url).toBe('https://www.google.com')
      expect(res.reply).toBe('Opening Google')
    })

    it("'open youtube' routes to OPEN WEBSITES (not youtube play)", () => {
      const res = routeCommand('open youtube')
      expect(res.action.type).toBe('open-url')
      expect(res.action.url).toBe('https://www.youtube.com')
      expect(res.reply).toBe('Opening YouTube')
    })
  })
})
