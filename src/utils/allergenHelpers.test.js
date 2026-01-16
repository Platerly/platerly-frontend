import { describe, it, expect } from 'vitest'
import { norm, variants, isSevere, sevRank } from './allergenHelpers'

describe('allergenHelpers', () => {
  describe('norm', () => {
    it('should lowercase and trim strings', () => {
      expect(norm('  HELLO  ')).toBe('hello')
    })

    it('should collapse multiple spaces', () => {
      expect(norm('hello   world')).toBe('hello world')
    })

    it('should handle null/undefined', () => {
      expect(norm(null)).toBe('')
      expect(norm(undefined)).toBe('')
    })

    it('should handle empty strings', () => {
      expect(norm('')).toBe('')
      expect(norm('   ')).toBe('')
    })
  })

  describe('variants', () => {
    it('should return singular and plural forms', () => {
      const result = variants('egg')
      expect(result).toContain('egg')
      expect(result).toContain('eggs')
    })

    it('should handle words ending in s', () => {
      const result = variants('eggs')
      expect(result).toContain('eggs')
      expect(result).toContain('egg')
    })

    it('should return empty array for empty input', () => {
      expect(variants('')).toEqual([])
      expect(variants(null)).toEqual([])
    })

    it('should normalize input before processing', () => {
      const result = variants('  EGG  ')
      expect(result).toContain('egg')
      expect(result).toContain('eggs')
    })
  })

  describe('isSevere', () => {
    it('should return true for high severity', () => {
      expect(isSevere('high')).toBe(true)
      expect(isSevere('HIGH')).toBe(true)
      expect(isSevere('High')).toBe(true)
    })

    it('should return true for medium severity', () => {
      expect(isSevere('medium')).toBe(true)
      expect(isSevere('MEDIUM')).toBe(true)
    })

    it('should return false for low severity', () => {
      expect(isSevere('low')).toBe(false)
    })

    it('should return false for invalid input', () => {
      expect(isSevere('')).toBe(false)
      expect(isSevere(null)).toBe(false)
      expect(isSevere('unknown')).toBe(false)
    })
  })

  describe('sevRank', () => {
    it('should return 3 for high', () => {
      expect(sevRank('high')).toBe(3)
    })

    it('should return 2 for medium', () => {
      expect(sevRank('medium')).toBe(2)
    })

    it('should return 1 for low', () => {
      expect(sevRank('low')).toBe(1)
    })

    it('should return 0 for unknown values', () => {
      expect(sevRank('')).toBe(0)
      expect(sevRank('unknown')).toBe(0)
      expect(sevRank(null)).toBe(0)
    })
  })
})
