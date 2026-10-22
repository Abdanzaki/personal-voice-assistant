import { ASSISTANT_NAME } from '../config.js'
import { evaluateExpression, tokenize } from './calculator.js'
import { extractWakeCommand } from './wakeWord.js'

export { extractWakeCommand }

export const JOKES = [
  'Why do programmers prefer dark mode? Because light attracts bugs!',
  "Why did the JavaScript developer wear glasses? Because they didn't C#!",
  "There are 10 types of people in the world: those who understand binary, and those who don't.",
  'Why was the computer cold? It left its Windows open!',
  'What do you call a fake noodle? An impasta!',
  'Why did the scarecrow win an award? Because he was outstanding in his field!',
  'How does a penguin build its house? Igloos it together!',
  "Why do we tell actors to 'break a leg'? Because every play has a cast!",
  'Why did the bicycle fall over? Because it was two-tired!',
  "What is an astronaut's favorite part of a computer? The space bar!",
]

export const SITE_MAP = {
  youtube: { name: 'YouTube', url: 'https://www.youtube.com' },
  google: { name: 'Google', url: 'https://www.google.com' },
  github: { name: 'GitHub', url: 'https://github.com' },
  gmail: { name: 'Gmail', url: 'https://mail.google.com' },
  twitter: { name: 'Twitter', url: 'https://twitter.com' },
  x: { name: 'X', url: 'https://x.com' },
  instagram: { name: 'Instagram', url: 'https://www.instagram.com' },
  linkedin: { name: 'LinkedIn', url: 'https://www.linkedin.com' },
  reddit: { name: 'Reddit', url: 'https://www.reddit.com' },
  amazon: { name: 'Amazon', url: 'https://www.amazon.com' },
  wikipedia: { name: 'Wikipedia', url: 'https://www.wikipedia.org' },
  netflix: { name: 'Netflix', url: 'https://www.netflix.com' },
  spotify: { name: 'Spotify', url: 'https://open.spotify.com' },
  'stack overflow': { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
  stackoverflow: { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
}

/**
 * Normalizes input text by removing punctuation, extra spaces, and lowercasing.
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Pure function that routes a recognized or typed transcript to an appropriate reply and action.
 *
 * @param {string} transcript - The raw speech or text transcript.
 * @returns {{ reply: string | null, action: object }}
 */
export function routeCommand(transcript) {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return { reply: null, action: { type: 'unknown' } }
  }

  const nameLower = ASSISTANT_NAME.toLowerCase()

  // 1. Strip leading wake phrase while preserving raw casing and punctuation for queries/math
  let strippedRaw = transcript.trim()
  const wakePrefixRegex = new RegExp(
    `^(?:(?:hey|hello|hi|ok|okay)\\s+)?${nameLower}[,:\\s]*`,
    'i'
  )
  const wakeMatch = strippedRaw.match(wakePrefixRegex)
  if (wakeMatch) {
    strippedRaw = strippedRaw.slice(wakeMatch[0].length).trim()
  } else {
    // Strip conversational greeting prefix if followed by command words
    const salutationMatch = strippedRaw.match(/^(?:hey|hello|hi|ok|okay)[,:\s]+(?=[a-zA-Z0-9])/i)
    if (salutationMatch && strippedRaw.length > salutationMatch[0].length) {
      strippedRaw = strippedRaw.slice(salutationMatch[0].length).trim()
    }
  }

  const normalizedFull = normalizeText(transcript)
  const normalizedStripped = normalizeText(strippedRaw)

  // 2. CONTROLS ('stop' / 'stop speaking' / 'be quiet' -> stop-speaking; 'repeat that' / 'repeat' -> repeat)
  const stopPhrases = ['stop', 'stop speaking', 'be quiet', 'quiet', 'shut up']
  const repeatPhrases = ['repeat that', 'say that again', 'repeat', 'say again']

  if (
    stopPhrases.includes(normalizedStripped) ||
    stopPhrases.includes(normalizedFull)
  ) {
    return { reply: null, action: { type: 'stop-speaking' } }
  }

  if (
    repeatPhrases.includes(normalizedStripped) ||
    repeatPhrases.includes(normalizedFull)
  ) {
    return { reply: null, action: { type: 'repeat' } }
  }

  // 3. GREETINGS (Phase 1)
  const greetingPhrases = [
    'hello',
    'hi',
    'hey',
    `hey ${nameLower}`,
    `hello ${nameLower}`,
    `hi ${nameLower}`,
    'good morning',
    'good afternoon',
    'good evening',
    'greetings',
    nameLower,
  ]

  if (
    greetingPhrases.includes(normalizedFull) ||
    greetingPhrases.includes(normalizedStripped) ||
    (!strippedRaw && wakeMatch)
  ) {
    return {
      reply: `Hello! I am ${ASSISTANT_NAME}. How can I assist you today?`,
      action: { type: 'greeting' },
    }
  }

  // Helper matching on normalized representations
  const targets = [normalizedStripped, normalizedFull].filter(Boolean)
  const matchesAny = (phrases) => {
    return targets.some((target) =>
      phrases.some((phrase) => target === phrase || target.startsWith(phrase))
    )
  }

  // 4. TIME (must precede wikipedia and calculator)
  const timePhrases = [
    'what time is it',
    'current time',
    'tell me the time',
    'what is the time',
    'whats the time',
    'the time',
    'time check',
  ]
  if (matchesAny(timePhrases)) {
    const now = new Date()
    const formattedTime = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    })
    return {
      reply: `The current time is ${formattedTime}.`,
      action: { type: 'time', timestamp: now.toISOString() },
    }
  }

  // 5. DATE (must precede wikipedia and calculator)
  const datePhrases = [
    'what is the date',
    'what day is it',
    'today s date',
    'todays date',
    'what is today s date',
    'what date is it',
    'what is todays date',
    'current date',
    'date today',
  ]
  if (matchesAny(datePhrases)) {
    const now = new Date()
    const formattedDate = now.toLocaleDateString([], {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    return {
      reply: `Today is ${formattedDate}.`,
      action: { type: 'date', timestamp: now.toISOString() },
    }
  }

  // 6. JOKE (Phase 1)
  const jokePhrases = [
    'tell me a joke',
    'make me laugh',
    'tell a joke',
    'say a joke',
    'another joke',
    'give me a joke',
    'crack a joke',
  ]
  if (matchesAny(jokePhrases)) {
    const randomJoke = JOKES[Math.floor(Math.random() * JOKES.length)]
    return {
      reply: randomJoke,
      action: { type: 'joke' },
    }
  }

  // 7. NAME / IDENTITY (Phase 1)
  const namePhrases = [
    'what is your name',
    'who are you',
    'whats your name',
    'what s your name',
    'tell me your name',
    'your name',
  ]
  if (matchesAny(namePhrases)) {
    return {
      reply: `I am ${ASSISTANT_NAME}, your personal voice assistant.`,
      action: { type: 'name' },
    }
  }

  // 8. OPEN WEBSITES
  const openSiteMatch = strippedRaw.match(/^open(?:\s+up)?\s+(.+?)[?.!]*$/i)
  if (openSiteMatch) {
    const rawTarget = openSiteMatch[1].trim().toLowerCase()
    // Handle both single word and multi-word keys (e.g. "stack overflow" or "stackoverflow")
    if (SITE_MAP[rawTarget]) {
      const site = SITE_MAP[rawTarget]
      return {
        reply: `Opening ${site.name}`,
        action: { type: 'open-url', url: site.url },
      }
    }
  }

  // 9. YOUTUBE
  // 'play <q> on youtube'
  const playYoutubeMatch = strippedRaw.match(/^play\s+(.+?)\s+on\s+youtube[?.!]*$/i)
  if (playYoutubeMatch) {
    const query = playYoutubeMatch[1].trim()
    if (query) {
      return {
        reply: `Playing ${query} on YouTube`,
        action: {
          type: 'open-url',
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        },
      }
    }
  }

  // 'search youtube for <q>' or 'youtube <q>'
  const searchYoutubeMatch = strippedRaw.match(
    /^(?:search\s+youtube\s+for|youtube)\s+(.+?)[?.!]*$/i
  )
  if (searchYoutubeMatch) {
    const query = searchYoutubeMatch[1].trim()
    if (query) {
      return {
        reply: `Searching YouTube for ${query}`,
        action: {
          type: 'open-url',
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        },
      }
    }
  }

  // 10. WEATHER (must precede wikipedia and calculator)
  // 'weather in <city>', 'what is the weather in <city>', 'how is the weather in <city>'
  const weatherWithCityMatch = strippedRaw.match(
    /^(?:(?:what(?:'s|\s+is)?|how(?:'s|\s+is)?)\s+the\s+weather(?:\s+like)?\s+(?:in|for|at)|weather\s+(?:in|for|at))\s+(.+?)[?.!]*$/i
  )
  if (weatherWithCityMatch) {
    const city = weatherWithCityMatch[1].trim().replace(/[?.!]+$/, '').trim()
    return {
      reply: null,
      action: { type: 'weather', city: city || 'Hyderabad' },
    }
  }

  // Bare 'weather' or 'what is the weather' -> defaults to 'Hyderabad'
  const weatherNoCityMatch = strippedRaw.match(
    /^(?:(?:what(?:'s|\s+is)?|how(?:'s|\s+is)?)\s+the\s+weather(?:\s+like)?|the\s+weather|weather)[?.!]*$/i
  )
  if (weatherNoCityMatch) {
    return {
      reply: null,
      action: { type: 'weather', city: 'Hyderabad' },
    }
  }

  // 11. CALCULATOR (must precede wikipedia when arithmetic parses)
  // 'calculate <expr>'
  const calcExplicitMatch = strippedRaw.match(/^calculate\s+(.+?)[?.!]*$/i)
  if (calcExplicitMatch) {
    const expr = calcExplicitMatch[1].trim()
    const evalRes = evaluateExpression(expr)
    if (evalRes.success) {
      return {
        reply: evalRes.reply,
        action: { type: 'calculate', result: evalRes.result, expression: expr },
      }
    }
    if (evalRes.error === 'division-by-zero') {
      return {
        reply: evalRes.reply,
        action: { type: 'calculate', error: 'division-by-zero', expression: expr },
      }
    }
  }

  // 'what is <expr-with-numbers>'
  const whatIsMathMatch = strippedRaw.match(
    /^(?:what\s+is|what's|whats)\s+(.+?)[?.!]*$/i
  )
  if (whatIsMathMatch) {
    const candidate = whatIsMathMatch[1].trim()
    const evalRes = evaluateExpression(candidate)
    if (evalRes.success) {
      return {
        reply: evalRes.reply,
        action: { type: 'calculate', result: evalRes.result, expression: candidate },
      }
    }
    if (evalRes.error === 'division-by-zero') {
      return {
        reply: evalRes.reply,
        action: { type: 'calculate', error: 'division-by-zero', expression: candidate },
      }
    }
    // If not a valid math expression, fall through to wikipedia
  }

  // Bare arithmetic expression (e.g. '12 * 8', '0.1 + 0.2', '4 plus 5', '10 / 0')
  const cleanBare = strippedRaw.replace(/[?.!]+$/, '').trim()
  const tokens = tokenize(cleanBare)
  if (tokens && tokens.length > 0) {
    const hasOperator = tokens.some((t) =>
      ['PLUS', 'MINUS', 'STAR', 'SLASH'].includes(t.type)
    )
    if (hasOperator) {
      const evalRes = evaluateExpression(cleanBare)
      if (evalRes.success) {
        return {
          reply: evalRes.reply,
          action: { type: 'calculate', result: evalRes.result, expression: cleanBare },
        }
      }
      if (evalRes.error === 'division-by-zero') {
        return {
          reply: evalRes.reply,
          action: { type: 'calculate', error: 'division-by-zero', expression: cleanBare },
        }
      }
    }
  }

  // 12. WIKIPEDIA
  // 'look up <topic> on wikipedia' / 'search for <topic> on wikipedia'
  const wikiLookupMatch = strippedRaw.match(
    /^(?:look\s*up|search\s+for|search)\s+(.+?)\s+on\s+wikipedia[?.!]*$/i
  )
  if (wikiLookupMatch) {
    const query = wikiLookupMatch[1].trim()
    if (query) {
      return { reply: null, action: { type: 'wikipedia', query } }
    }
  }

  // 'wikipedia <topic>'
  const wikiPrefixMatch = strippedRaw.match(/^wikipedia\s+(.+?)[?.!]*$/i)
  if (wikiPrefixMatch) {
    const query = wikiPrefixMatch[1].trim()
    if (query) {
      return { reply: null, action: { type: 'wikipedia', query } }
    }
  }

  // 'who is <topic>' / 'who was <topic>'
  const whoIsMatch = strippedRaw.match(/^who\s+(?:is|was)\s+(.+?)[?.!]*$/i)
  if (whoIsMatch) {
    const query = whoIsMatch[1].trim()
    if (query) {
      return { reply: null, action: { type: 'wikipedia', query } }
    }
  }

  // 'what is <topic>' / 'what was <topic>'
  const whatIsMatch = strippedRaw.match(
    /^(?:what\s+(?:is|was)|what's|whats)\s+(.+?)[?.!]*$/i
  )
  if (whatIsMatch) {
    const query = whatIsMatch[1].trim()
    if (query) {
      return { reply: null, action: { type: 'wikipedia', query } }
    }
  }

  // 'tell me about <topic>'
  const tellMeMatch = strippedRaw.match(/^tell\s+me\s+about\s+(.+?)[?.!]*$/i)
  if (tellMeMatch) {
    const query = tellMeMatch[1].trim()
    if (query) {
      return { reply: null, action: { type: 'wikipedia', query } }
    }
  }

  // 13. GOOGLE SEARCH
  // 'search google for <q>', 'search for <q>', 'google <q>'
  const googleSearchMatch = strippedRaw.match(
    /^(?:search\s+google\s+for|search\s+for|google)\s+(.+?)[?.!]*$/i
  )
  if (googleSearchMatch) {
    const query = googleSearchMatch[1].trim()
    if (query) {
      return {
        reply: `Searching Google for ${query}`,
        action: {
          type: 'open-url',
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        },
      }
    }
  }

  // 14. FALLBACK for unmatched
  return {
    reply: null,
    action: { type: 'unknown', query: transcript },
  }
}
