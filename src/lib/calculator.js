/**
 * Safe Math Tokenizer, Parser, and Evaluator.
 * Pure implementation using Recursive Descent: absolutely NO eval() or Function().
 */

const WORD_OPERATORS = [
  { pattern: /\bmultiplied\s+by\b/gi, replacement: ' * ' },
  { pattern: /\bdivided\s+by\b/gi, replacement: ' / ' },
  { pattern: /\btimes\b/gi, replacement: ' * ' },
  { pattern: /\bplus\b/gi, replacement: ' + ' },
  { pattern: /\bminus\b/gi, replacement: ' - ' },
  { pattern: /\bover\b/gi, replacement: ' / ' },
]

const WORD_NUMBERS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
}

/**
 * Normalizes words, operators, decimals, and number words into a clean math string.
 */
export function normalizeMathString(raw) {
  if (!raw || typeof raw !== 'string') return ''
  let text = raw.trim()

  // Replace multi-word and word operators first
  for (const { pattern, replacement } of WORD_OPERATORS) {
    text = text.replace(pattern, replacement)
  }

  // Convert word numbers (e.g. "four", "twenty")
  text = text.replace(/\b[a-z]+\b/gi, (word) => {
    const lower = word.toLowerCase()
    if (Object.prototype.hasOwnProperty.call(WORD_NUMBERS, lower)) {
      return WORD_NUMBERS[lower]
    }
    return word
  })

  // Convert "point" between numbers to decimal dot (e.g. "3 point 5" -> "3.5")
  text = text.replace(/\bpoint\b/gi, '.')
  text = text.replace(/(\d+)\s*\.\s*(\d+)/g, '$1.$2')

  // Convert 'x' between numbers or parentheses to multiplication
  text = text.replace(/(\d|\))\s*x\s*(\d|\()/gi, '$1 * $2')

  text = text.replace(/\s+/g, ' ').trim()

  return text
}

/**
 * Formats a math expression for spoken delivery (e.g. "12 * 8" -> "12 times 8").
 */
export function formatSpokenExpression(rawExpr) {
  if (!rawExpr || typeof rawExpr !== 'string') return ''
  let text = rawExpr.trim()

  // Replace symbols with speech-friendly operator words
  text = text.replace(/\*/g, ' times ')
  text = text.replace(/\//g, ' divided by ')
  text = text.replace(/\+/g, ' plus ')
  text = text.replace(/(?<=\S)\s*-\s*(?=\S)/g, ' minus ')
  text = text.replace(/\s+/g, ' ').trim()
  return text
}

/**
 * Rounds numbers to at most ~6 significant decimal places, eliminating floating point noise.
 */
export function formatResult(num) {
  if (!Number.isFinite(num)) {
    return 'undefined'
  }
  const rounded = Number(Math.round(Number(num + 'e+6')) + 'e-6')
  return rounded.toString()
}

/**
 * Tokenizes the input string into math tokens.
 * Returns null if any invalid/unsupported characters are encountered.
 */
export function tokenize(rawInput) {
  const normalized = normalizeMathString(rawInput)
  if (!normalized) return null

  const tokens = []
  let i = 0

  while (i < normalized.length) {
    const ch = normalized[i]

    if (/\s/.test(ch)) {
      i++
      continue
    }

    if (ch === '+') {
      tokens.push({ type: 'PLUS', text: '+' })
      i++
      continue
    }
    if (ch === '-') {
      tokens.push({ type: 'MINUS', text: '-' })
      i++
      continue
    }
    if (ch === '*' || ch === '×') {
      tokens.push({ type: 'STAR', text: '*' })
      i++
      continue
    }
    if (ch === '/' || ch === '÷') {
      tokens.push({ type: 'SLASH', text: '/' })
      i++
      continue
    }
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', text: '(' })
      i++
      continue
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', text: ')' })
      i++
      continue
    }

    if (/[\d.]/.test(ch)) {
      let numStr = ''
      let hasDot = false
      while (i < normalized.length && /[\d.]/.test(normalized[i])) {
        if (normalized[i] === '.') {
          if (hasDot) break
          hasDot = true
        }
        numStr += normalized[i]
        i++
      }
      const val = parseFloat(numStr)
      if (isNaN(val)) return null
      tokens.push({ type: 'NUMBER', value: val, text: numStr })
      continue
    }

    // Encountered non-math character
    return null
  }

  return tokens
}

/**
 * Evaluates an expression string safely via Recursive Descent.
 *
 * @param {string} rawInput - The mathematical expression.
 * @returns {{
 *   success: boolean,
 *   result?: number,
 *   formatted?: string,
 *   spokenExpression?: string,
 *   reply?: string,
 *   error?: string
 * }}
 */
export function evaluateExpression(rawInput) {
  const tokens = tokenize(rawInput)
  if (!tokens || tokens.length === 0) {
    return { success: false, error: 'invalid' }
  }

  let pos = 0

  function parseExpression() {
    let left = parseTerm()
    while (
      pos < tokens.length &&
      (tokens[pos].type === 'PLUS' || tokens[pos].type === 'MINUS')
    ) {
      const op = tokens[pos].type
      pos++
      const right = parseTerm()
      left = op === 'PLUS' ? left + right : left - right
    }
    return left
  }

  function parseTerm() {
    let left = parseFactor()
    while (
      pos < tokens.length &&
      (tokens[pos].type === 'STAR' || tokens[pos].type === 'SLASH')
    ) {
      const op = tokens[pos].type
      pos++
      const right = parseFactor()
      if (op === 'SLASH') {
        if (right === 0) {
          throw new Error('DIVISION_BY_ZERO')
        }
        left = left / right
      } else {
        left = left * right
      }
    }
    return left
  }

  function parseFactor() {
    if (pos >= tokens.length) {
      throw new Error('UNEXPECTED_END')
    }

    // Unary plus
    if (tokens[pos].type === 'PLUS') {
      pos++
      return parseFactor()
    }

    // Unary minus
    if (tokens[pos].type === 'MINUS') {
      pos++
      return -parseFactor()
    }

    // Number literal
    if (tokens[pos].type === 'NUMBER') {
      const val = tokens[pos].value
      pos++
      return val
    }

    // Parentheses
    if (tokens[pos].type === 'LPAREN') {
      pos++
      const val = parseExpression()
      if (pos >= tokens.length || tokens[pos].type !== 'RPAREN') {
        throw new Error('MISMATCHED_PARENTHESES')
      }
      pos++
      return val
    }

    throw new Error('UNEXPECTED_TOKEN')
  }

  try {
    const numericResult = parseExpression()
    if (pos < tokens.length) {
      return { success: false, error: 'invalid' }
    }

    const formatted = formatResult(numericResult)
    const spoken = formatSpokenExpression(rawInput)

    return {
      success: true,
      result: Number(formatted),
      formatted,
      spokenExpression: spoken,
      reply: `${spoken} is ${formatted}`,
    }
  } catch (err) {
    if (err.message === 'DIVISION_BY_ZERO') {
      return {
        success: false,
        error: 'division-by-zero',
        reply: 'Cannot divide by zero.',
      }
    }
    return { success: false, error: 'invalid' }
  }
}
