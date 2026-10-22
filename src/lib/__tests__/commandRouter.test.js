import { describe, it, expect } from 'vitest'
import {
  routeCommand,
  normalizeText,
  SITE_MAP,
  JOKES,
  extractWakeCommand,
} from '../commandRouter.js'
import { ASSISTANT_NAME } from '../../config.js'

describe('commandRouter', () => {
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

  describe('Phase 1 Regressions & Intent Ordering', () => {
    it("routes 'what is the time' to time command (not calculator or wikipedia)", () => {
      const result = routeCommand('what is the time')
      expect(result.action.type).toBe('time')
      expect(result.action.timestamp).toBeDefined()
      expect(result.reply).toMatch(/The current time is \d+:\d+/)
    })

    it("routes 'what time is it' to time command", () => {
      const result = routeCommand('what time is it')
      expect(result.action.type).toBe('time')
      expect(result.action.timestamp).toBeDefined()
    })

    it("routes 'what is the date' to date command (not wikipedia)", () => {
      const result = routeCommand('what is the date')
      expect(result.action.type).toBe('date')
      expect(result.action.timestamp).toBeDefined()
      expect(result.reply).toMatch(/Today is/)
    })

    it("routes 'today\\'s date' to date command", () => {
      const result = routeCommand("today's date")
      expect(result.action.type).toBe('date')
    })

    it("routes 'what is your name' to name command (not wikipedia)", () => {
      const result = routeCommand('what is your name')
      expect(result.action.type).toBe('name')
      expect(result.reply).toContain(ASSISTANT_NAME)
    })

    it("routes 'who are you' to name command", () => {
      const result = routeCommand('who are you')
      expect(result.action.type).toBe('name')
      expect(result.reply).toContain(ASSISTANT_NAME)
    })

    it("routes 'tell me a joke' to joke command", () => {
      const result = routeCommand('tell me a joke')
      expect(result.action.type).toBe('joke')
      expect(result.reply).toBeTruthy()
      expect(JOKES).toContain(result.reply)
    })

    it("routes 'hello' to greeting command", () => {
      const result = routeCommand('hello')
      expect(result.action.type).toBe('greeting')
      expect(result.reply).toContain(ASSISTANT_NAME)
    })

    it("routes 'hey jarvis' to greeting command", () => {
      const result = routeCommand('hey jarvis')
      expect(result.action.type).toBe('greeting')
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

  describe('1. Open Websites', () => {
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

    const expectedSites = [
      ['open youtube', 'https://www.youtube.com', 'Opening YouTube'],
      ['open google', 'https://www.google.com', 'Opening Google'],
      ['open github', 'https://github.com', 'Opening GitHub'],
      ['open gmail', 'https://mail.google.com', 'Opening Gmail'],
      ['open twitter', 'https://twitter.com', 'Opening Twitter'],
      ['open x', 'https://x.com', 'Opening X'],
      ['open instagram', 'https://www.instagram.com', 'Opening Instagram'],
      ['open linkedin', 'https://www.linkedin.com', 'Opening LinkedIn'],
      ['open reddit', 'https://www.reddit.com', 'Opening Reddit'],
      ['open amazon', 'https://www.amazon.com', 'Opening Amazon'],
      ['open wikipedia', 'https://www.wikipedia.org', 'Opening Wikipedia'],
      ['open netflix', 'https://www.netflix.com', 'Opening Netflix'],
      ['open spotify', 'https://open.spotify.com', 'Opening Spotify'],
      ['open stack overflow', 'https://stackoverflow.com', 'Opening Stack Overflow'],
      ['open stackoverflow', 'https://stackoverflow.com', 'Opening Stack Overflow'],
    ]

    expectedSites.forEach(([command, url, reply]) => {
      it(`routes '${command}' to ${url}`, () => {
        const result = routeCommand(command)
        expect(result.action).toEqual({ type: 'open-url', url })
        expect(result.reply).toBe(reply)
      })
    })

    it('works with wake word prefix', () => {
      const result = routeCommand('hey jarvis open github')
      expect(result.action).toEqual({ type: 'open-url', url: 'https://github.com' })
      expect(result.reply).toBe('Opening GitHub')
    })
  })

  describe('2. Google Search', () => {
    it("handles 'search for <query>'", () => {
      const result = routeCommand('search for web development tutorials')
      expect(result.action).toEqual({
        type: 'open-url',
        url: 'https://www.google.com/search?q=web%20development%20tutorials',
      })
      expect(result.reply).toBe('Searching Google for web development tutorials')
    })

    it("handles 'google <query>'", () => {
      const result = routeCommand('google latest space telescope images')
      expect(result.action).toEqual({
        type: 'open-url',
        url: 'https://www.google.com/search?q=latest%20space%20telescope%20images',
      })
      expect(result.reply).toBe('Searching Google for latest space telescope images')
    })

    it("handles 'search google for <query>'", () => {
      const result = routeCommand('search google for vite plugins')
      expect(result.action).toEqual({
        type: 'open-url',
        url: 'https://www.google.com/search?q=vite%20plugins',
      })
      expect(result.reply).toBe('Searching Google for vite plugins')
    })

    it('strips wake words before searching', () => {
      const result = routeCommand('Jarvis google quantum supremacy')
      expect(result.action.url).toBe(
        'https://www.google.com/search?q=quantum%20supremacy'
      )
      expect(result.reply).toBe('Searching Google for quantum supremacy')
    })
  })

  describe('3. YouTube Search / Play', () => {
    it("handles 'play <query> on youtube'", () => {
      const result = routeCommand('play bohemian rhapsody on youtube')
      expect(result.action).toEqual({
        type: 'open-url',
        url: 'https://www.youtube.com/results?search_query=bohemian%20rhapsody',
      })
      expect(result.reply).toBe('Playing bohemian rhapsody on YouTube')
    })

    it("handles 'search youtube for <query>'", () => {
      const result = routeCommand('search youtube for cooking pasta')
      expect(result.action).toEqual({
        type: 'open-url',
        url: 'https://www.youtube.com/results?search_query=cooking%20pasta',
      })
      expect(result.reply).toBe('Searching YouTube for cooking pasta')
    })

    it("handles 'youtube <query>'", () => {
      const result = routeCommand('youtube lofi hip hop radio')
      expect(result.action).toEqual({
        type: 'open-url',
        url: 'https://www.youtube.com/results?search_query=lofi%20hip%20hop%20radio',
      })
      expect(result.reply).toBe('Searching YouTube for lofi hip hop radio')
    })
  })

  describe('4. Wikipedia', () => {
    it("handles 'who is <topic>'", () => {
      const result = routeCommand('who is Marie Curie')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'wikipedia', query: 'Marie Curie' })
    })

    it("handles 'who is Albert Einstein'", () => {
      const result = routeCommand('who is Albert Einstein')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'wikipedia', query: 'Albert Einstein' })
    })

    it("handles 'what is <topic>' when topic is not a math expression", () => {
      const result = routeCommand('what is photosynthesis')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'wikipedia', query: 'photosynthesis' })
    })

    it("handles 'tell me about <topic>'", () => {
      const result = routeCommand('tell me about black holes')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'wikipedia', query: 'black holes' })
    })

    it("handles 'tell me about Mars'", () => {
      const result = routeCommand('tell me about Mars')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'wikipedia', query: 'Mars' })
    })

    it("handles 'wikipedia <topic>'", () => {
      const result = routeCommand('wikipedia artificial intelligence')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({
        type: 'wikipedia',
        query: 'artificial intelligence',
      })
    })

    it("handles 'look up <topic> on wikipedia'", () => {
      const result = routeCommand('look up quantum computing on wikipedia')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({
        type: 'wikipedia',
        query: 'quantum computing',
      })
    })

    it("ensures 'open wikipedia' routes to site open, not wikipedia search", () => {
      const result = routeCommand('open wikipedia')
      expect(result.action.type).toBe('open-url')
      expect(result.action.url).toBe('https://www.wikipedia.org')
      expect(result.reply).toBe('Opening Wikipedia')
    })
  })

  describe('5. Weather', () => {
    it("handles 'weather in <city>'", () => {
      const result = routeCommand('weather in Tokyo')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'weather', city: 'Tokyo' })
    })

    it("handles 'what is the weather in <city>'", () => {
      const result = routeCommand('what is the weather in London')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'weather', city: 'London' })
    })

    it("handles 'how is the weather in <city>'", () => {
      const result = routeCommand('how is the weather in New York')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'weather', city: 'New York' })
    })

    it("handles bare 'weather' with default city Hyderabad", () => {
      const result = routeCommand('weather')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'weather', city: 'Hyderabad' })
    })

    it("handles 'what is the weather' with default city Hyderabad", () => {
      const result = routeCommand('what is the weather')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'weather', city: 'Hyderabad' })
    })

    it("handles 'how is the weather' with default city Hyderabad", () => {
      const result = routeCommand('how is the weather')
      expect(result.reply).toBeNull()
      expect(result.action).toEqual({ type: 'weather', city: 'Hyderabad' })
    })
  })

  describe('6. Calculator Routing & Intent Ordering', () => {
    it("routes 'what is 4 plus 5' to calculator (NOT wikipedia)", () => {
      const result = routeCommand('what is 4 plus 5')
      expect(result.action.type).toBe('calculate')
      expect(result.action.result).toBe(9)
      expect(result.reply).toBe('4 plus 5 is 9')
    })

    it("routes 'calculate 12 * 8' to calculator", () => {
      const result = routeCommand('calculate 12 * 8')
      expect(result.action.type).toBe('calculate')
      expect(result.action.result).toBe(96)
      expect(result.reply).toBe('12 times 8 is 96')
    })

    it("routes bare expression '12 times 8' to calculator", () => {
      const result = routeCommand('12 times 8')
      expect(result.action.type).toBe('calculate')
      expect(result.action.result).toBe(96)
      expect(result.reply).toBe('12 times 8 is 96')
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

    it('routes division by zero with friendly reply', () => {
      const res1 = routeCommand('what is 10 / 0')
      expect(res1.action.type).toBe('calculate')
      expect(res1.action.error).toBe('division-by-zero')
      expect(res1.reply).toBe('Cannot divide by zero.')

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

  describe('7. Controls', () => {
    it.each(['stop', 'stop speaking', 'be quiet'])(
      "routes '%s' to stop-speaking action with null reply",
      (phrase) => {
        const result = routeCommand(phrase)
        expect(result.reply).toBeNull()
        expect(result.action).toEqual({ type: 'stop-speaking' })
      }
    )

    it.each(['repeat that', 'say that again', 'repeat'])(
      "routes '%s' to repeat action with null reply",
      (phrase) => {
        const result = routeCommand(phrase)
        expect(result.reply).toBeNull()
        expect(result.action).toEqual({ type: 'repeat' })
      }
    )

    it('works with wake word prefix for controls', () => {
      const res1 = routeCommand('Jarvis stop')
      expect(res1.action).toEqual({ type: 'stop-speaking' })
      expect(res1.reply).toBeNull()

      const res2 = routeCommand('hey jarvis repeat that')
      expect(res2.action).toEqual({ type: 'repeat' })
      expect(res2.reply).toBeNull()
    })
  })

  describe('8. Intent Ordering Regressions (Critical)', () => {
    it("'what is artificial intelligence' routes to WIKIPEDIA", () => {
      const res = routeCommand('what is artificial intelligence')
      expect(res.action.type).toBe('wikipedia')
      expect(res.action.query).toBe('artificial intelligence')
    })

    it("'open google' routes to OPEN WEBSITES", () => {
      const res = routeCommand('open google')
      expect(res.action.type).toBe('open-url')
      expect(res.action.url).toBe('https://www.google.com')
      expect(res.reply).toBe('Opening Google')
    })

    it("'open youtube' routes to OPEN WEBSITES", () => {
      const res = routeCommand('open youtube')
      expect(res.action.type).toBe('open-url')
      expect(res.action.url).toBe('https://www.youtube.com')
      expect(res.reply).toBe('Opening YouTube')
    })
  })
})
