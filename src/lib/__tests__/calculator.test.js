import { describe, it, expect } from 'vitest'
import {
  evaluateExpression,
  tokenize,
  formatResult,
  formatSpokenExpression,
  normalizeMathString,
} from '../calculator.js'

describe('calculator pure logic', () => {
  describe('Basic operations and precedence', () => {
    it('evaluates addition', () => {
      const res = evaluateExpression('4 + 5')
      expect(res.success).toBe(true)
      expect(res.result).toBe(9)
      expect(res.reply).toBe('4 plus 5 is 9')
    })

    it('evaluates subtraction', () => {
      const res1 = evaluateExpression('50 - 15')
      expect(res1.success).toBe(true)
      expect(res1.result).toBe(35)
      expect(res1.reply).toBe('50 minus 15 is 35')

      const res2 = evaluateExpression('100 - 35')
      expect(res2.success).toBe(true)
      expect(res2.result).toBe(65)
    })

    it('evaluates multiplication', () => {
      const res = evaluateExpression('12 * 8')
      expect(res.success).toBe(true)
      expect(res.result).toBe(96)
      expect(res.reply).toBe('12 times 8 is 96')
    })

    it('evaluates division', () => {
      const res1 = evaluateExpression('100 / 4')
      expect(res1.success).toBe(true)
      expect(res1.result).toBe(25)
      expect(res1.reply).toBe('100 divided by 4 is 25')

      const res2 = evaluateExpression('50 / 5')
      expect(res2.success).toBe(true)
      expect(res2.result).toBe(10)
    })

    it('respects operator precedence (* before +)', () => {
      const res = evaluateExpression('2 + 3 * 4')
      expect(res.success).toBe(true)
      expect(res.result).toBe(14)
    })

    it('respects parentheses', () => {
      const res1 = evaluateExpression('(2 + 3) * 4')
      expect(res1.success).toBe(true)
      expect(res1.result).toBe(20)

      const res2 = evaluateExpression('(10 - 2) / (3 + 1)')
      expect(res2.success).toBe(true)
      expect(res2.result).toBe(2)
    })
  })

  describe('Word operators and speech phrases', () => {
    it("handles 'plus'", () => {
      const res = evaluateExpression('4 plus 5')
      expect(res.success).toBe(true)
      expect(res.result).toBe(9)
      expect(res.reply).toBe('4 plus 5 is 9')
    })

    it("handles 'minus'", () => {
      const res = evaluateExpression('10 minus 3')
      expect(res.success).toBe(true)
      expect(res.result).toBe(7)
      expect(res.reply).toBe('10 minus 3 is 7')
    })

    it("handles 'times'", () => {
      const res = evaluateExpression('12 times 8')
      expect(res.success).toBe(true)
      expect(res.result).toBe(96)
      expect(res.reply).toBe('12 times 8 is 96')
    })

    it("handles 'multiplied by'", () => {
      const res = evaluateExpression('6 multiplied by 7')
      expect(res.success).toBe(true)
      expect(res.result).toBe(42)
    })

    it("handles 'divided by'", () => {
      const res = evaluateExpression('100 divided by 4')
      expect(res.success).toBe(true)
      expect(res.result).toBe(25)
      expect(res.reply).toBe('100 divided by 4 is 25')
    })

    it('handles number words', () => {
      const res1 = evaluateExpression('four plus five')
      expect(res1.success).toBe(true)
      expect(res1.result).toBe(9)

      const res2 = evaluateExpression('twelve times eight')
      expect(res2.success).toBe(true)
      expect(res2.result).toBe(96)
    })

    it('handles decimal word point', () => {
      const res = evaluateExpression('three point five times two')
      expect(res.success).toBe(true)
      expect(res.result).toBe(7)
    })
  })

  describe('Decimals and sensible rounding', () => {
    it('handles decimal addition without floating point noise', () => {
      const res = evaluateExpression('0.1 + 0.2')
      expect(res.success).toBe(true)
      expect(res.result).toBe(0.3)
      expect(res.formatted).toBe('0.3')
      expect(res.reply).toBe('0.1 plus 0.2 is 0.3')
      expect(res.formatted).not.toContain('0.30000000000000004')
    })

    it('rounds long repeating decimals to max ~6 decimals', () => {
      const res = evaluateExpression('1 / 3')
      expect(res.success).toBe(true)
      expect(res.formatted).toBe('0.333333')
    })

    it('formats 3.5 + 4.2 correctly', () => {
      const res = evaluateExpression('3.5 + 4.2')
      expect(res.success).toBe(true)
      expect(res.result).toBe(7.7)
      expect(res.formatted).toBe('7.7')
    })
  })

  describe('Division by zero', () => {
    it('handles division by zero gracefully', () => {
      const res = evaluateExpression('10 / 0')
      expect(res.success).toBe(false)
      expect(res.error).toBe('division-by-zero')
      expect(res.reply).toBe('Cannot divide by zero.')
    })

    it('handles word-based division by zero', () => {
      const res = evaluateExpression('5 divided by 0')
      expect(res.success).toBe(false)
      expect(res.error).toBe('division-by-zero')
      expect(res.reply).toBe('Cannot divide by zero.')
    })
  })

  describe('Helper functions', () => {
    it('normalizes math words and number words', () => {
      const normalized = normalizeMathString('four multiplied by five plus two')
      expect(normalized).toBe('4 * 5 + 2')

      expect(normalizeMathString('4 plus 5')).toBe('4 + 5')
      expect(normalizeMathString('10 minus 3')).toBe('10 - 3')
      expect(normalizeMathString('6 times 7')).toBe('6 * 7')
      expect(normalizeMathString('8 multiplied by 2')).toBe('8 * 2')
      expect(normalizeMathString('20 divided by 4')).toBe('20 / 4')
      expect(normalizeMathString('15 over 3')).toBe('15 / 3')
      expect(normalizeMathString('twenty divided by four')).toBe('20 / 4')
      expect(normalizeMathString('3 point 5 plus 1 point 2')).toBe('3.5 + 1.2')
    })

    it('formats spoken expressions cleanly', () => {
      expect(formatSpokenExpression('12 * 8')).toBe('12 times 8')
      expect(formatSpokenExpression('100 / 4')).toBe('100 divided by 4')
      expect(formatSpokenExpression('5 + 3')).toBe('5 plus 3')
      expect(formatSpokenExpression('9 - 4')).toBe('9 minus 4')
      expect(formatSpokenExpression('20 / 4')).toBe('20 divided by 4')
      expect(formatSpokenExpression('10 - 3')).toBe('10 minus 3')
    })

    it('formats results without trailing floating point noise', () => {
      expect(formatResult(0.1 + 0.2)).toBe('0.3')
      expect(formatResult(0.30000000000000004)).toBe('0.3')
      expect(formatResult(1 / 3)).toBe('0.333333')
      expect(formatResult(96)).toBe('96')
      expect(formatResult(-5)).toBe('-5')
      expect(formatResult(0)).toBe('0')
      expect(formatResult(2.5)).toBe('2.5')
      expect(formatResult(Infinity)).toBe('undefined')
      expect(formatResult(NaN)).toBe('undefined')
    })

    it('tokenizes valid expressions and returns null on invalid tokens', () => {
      const tokens = tokenize('12 + 3')
      expect(tokens).toHaveLength(3)
      expect(tokens[0].value).toBe(12)
      expect(tokens[1].type).toBe('PLUS')
      expect(tokens[2].value).toBe(3)

      expect(tokenize('@#$')).toBeNull()
    })
  })

  describe('Safety & Error Handling (NO eval or Function)', () => {
    it('rejects malicious or invalid JavaScript strings safely', () => {
      const res1 = evaluateExpression('alert(1)')
      expect(res1.success).toBe(false)
      expect(res1.error).toBe('invalid')

      const res2 = evaluateExpression('console.log(1)')
      expect(res2.success).toBe(false)
      expect(res2.error).toBe('invalid')
    })

    it('handles mismatched parentheses safely', () => {
      const res = evaluateExpression('(2 + 3')
      expect(res.success).toBe(false)
      expect(res.error).toBe('invalid')
    })

    it('handles empty or blank input', () => {
      expect(evaluateExpression('').success).toBe(false)
      expect(evaluateExpression('hello world').success).toBe(false)
      expect(evaluateExpression('++').success).toBe(false)
    })
  })
})
