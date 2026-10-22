import { ASSISTANT_NAME } from '../config.js'

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
  const normalized = normalizeText(transcript)
  if (!normalized) {
    return { reply: null, action: { type: 'unknown' } }
  }

  const nameLower = ASSISTANT_NAME.toLowerCase()

  // Extract command without leading wake phrases (e.g. "hey jarvis what time is it" -> "what time is it")
  let stripped = normalized
  const wakePrefixRegex = new RegExp(`^(hey|hello|hi|ok|okay)?\\s*${nameLower}\\s*`, 'i')
  if (wakePrefixRegex.test(normalized)) {
    stripped = normalized.replace(wakePrefixRegex, '').trim()
  }

  // 1. GREETING
  // Handle direct greetings with or without assistant name
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

  if (greetingPhrases.includes(normalized) || (!stripped && wakePrefixRegex.test(normalized))) {
    return {
      reply: `Hello! I am ${ASSISTANT_NAME}. How can I assist you today?`,
      action: { type: 'greeting' },
    }
  }

  // Check commands on both full normalized and stripped queries
  const targets = [stripped, normalized].filter(Boolean)

  const matchesAny = (phrases) => {
    return targets.some((target) =>
      phrases.some((phrase) => target === phrase || target.startsWith(phrase))
    )
  }

  // 2. TIME
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

  // 3. DATE
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

  // 4. JOKE
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

  // 5. NAME / IDENTITY
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

  // 6. FALLBACK for unmatched
  return {
    reply: null,
    action: { type: 'unknown', query: transcript },
  }
}
