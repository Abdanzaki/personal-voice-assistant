import { describe, it, expect } from 'vitest'
import {
  evaluateExpression,
  normalizeMathString,
  formatSpokenExpression,
  formatResult,
} from './calculator.js'

describe('calculator.js', () => {
  describe('normalizeMathString', () => {
    it('normalizes word operators to math symbols', () => {
      expect(normalizeMathString('4 plus 5')).toBe('4 + 5')
      expect(normalizeMathString('10 minus 3')).toBe('10 - 3')
      expect(normalizeMathString('6 times 7')).toBe('6 * 7')
      expect(normalizeMathString('8 multiplied by 2')).toBe('8 * 2')
      expect(normalizeMathString('20 divided by 4')).toBe('20 / 4')
      expect(normalizeMathString('15 over 3')).toBe('15 / 3')
    })

    it('normalizes number words into digits', () => {
      expect(normalizeMathString('four plus five')).toBe('4 + 5')
      expect(normalizeMathString('twelve times eight')).toBe('12 * 8')
      expect(normalizeMathString('twenty divided by four')).toBe('20 / 4')
    })

    it('normalizes point into decimal dot', () => {
      expect(normalizeMathString('3 point 5 plus 1 point 2')).toBe('3.5 + 1.2')
    })
  })

  describe('formatResult', () => {
    it('eliminates floating point noise (0.1 + 0.2 = 0.3)', () => {
      expect(formatResult(0.1 + 0.2)).toBe('0.3')
      expect(formatResult(0.30000000000000004)).toBe('0.3')
    })

    it('formats integer and simple floats cleanly', () => {
      expect(formatResult(96)).toBe('96')
      expect(formatResult(-5)).toBe('-5')
      expect(formatResult(0)).toBe('0')
      expect(formatResult(2.5)).toBe('2.5')
    })

    it('handles non-finite values safely', () => {
      expect(formatResult(Infinity)).toBe('undefined')
      expect(formatResult(NaN)).toBe('undefined')
    })
  })

  describe('formatSpokenExpression', () => {
    it('converts symbols into natural spoken phrases', () => {
      expect(formatSpokenExpression('12 * 8')).toBe('12 times 8')
      expect(formatSpokenExpression('4 + 5')).toBe('4 plus 5')
      expect(formatSpokenExpression('20 / 4')).toBe('20 divided by 4')
      expect(formatSpokenExpression('10 - 3')).toBe('10 minus 3')
    })
  })

  describe('evaluateExpression', () => {
    it('evaluates symbol operations correctly', () => {
      const res1 = evaluateExpression('12 * 8')
      expect(res1.success).toBe(true)
      expect(res1.result).toBe(96)
      expect(res1.reply).toBe('12 times 8 is 96')

      const res2 = evaluateExpression('4 + 5')
      expect(res2.success).toBe(true)
      expect(res2.result).toBe(9)
      expect(res2.reply).toBe('4 plus 5 is 9')

      const res3 = evaluateExpression('100 - 35')
      expect(res3.success).toBe(true)
      expect(res3.result).toBe(65)

      const res4 = evaluateExpression('50 / 5')
      expect(res4.success).toBe(true)
      expect(res4.result).toBe(10)
    })

    it('evaluates word operations correctly', () => {
      const res1 = evaluateExpression('4 plus 5')
      expect(res1.success).toBe(true)
      expect(res1.result).toBe(9)
      expect(res1.reply).toBe('4 plus 5 is 9')

      const res2 = evaluateExpression('6 multiplied by 7')
      expect(res2.success).toBe(true)
      expect(res2.result).toBe(42)

      const res3 = evaluateExpression('100 divided by 4')
      expect(res3.success).toBe(true)
      expect(res3.result).toBe(25)

      const res4 = evaluateExpression('12 times 8')
      expect(res4.success).toBe(true)
      expect(res4.result).toBe(96)
    })

    it('handles float precision accurately: 0.1 + 0.2 must answer 0.3', () => {
      const res = evaluateExpression('0.1 + 0.2')
      expect(res.success).toBe(true)
      expect(res.result).toBe(0.3)
      expect(res.formatted).toBe('0.3')
      expect(res.reply).toBe('0.1 plus 0.2 is 0.3')
    })

    it('handles division by zero with a friendly message', () => {
      const res1 = evaluateExpression('10 / 0')
      expect(res1.success).toBe(false)
      expect(res1.error).toBe('division-by-zero')
      expect(res1.reply).toBe('Cannot divide by zero.')

      const res2 = evaluateExpression('5 divided by 0')
      expect(res2.success).toBe(false)
      expect(res2.error).toBe('division-by-zero')
      expect(res2.reply).toBe('Cannot divide by zero.')
    })

    it('respects operator precedence and parentheses', () => {
      const res1 = evaluateExpression('2 + 3 * 4')
      expect(res1.result).toBe(14)

      const res2 = evaluateExpression('(2 + 3) * 4')
      expect(res2.result).toBe(20)

      const res3 = evaluateExpression('(10 - 2) / (3 + 1)')
      expect(res3.result).toBe(2)
    })

    it('rejects invalid or non-math expressions safely without eval', () => {
      expect(evaluateExpression('hello world').success).toBe(false)
      expect(evaluateExpression('console.log(1)').success).toBe(false)
      expect(evaluateExpression('').success).toBe(false)
      expect(evaluateExpression('++').success).toBe(false)
    })
  })
})
