import { describe, it, expect } from 'vitest'
import { probePython } from './python-bridge.js'

describe('v65/python-bridge', () => {
  describe('probePython()', () => {
    it('returns the correct shape: { available: boolean, version: string | null }', () => {
      const result = probePython()

      expect(typeof result.available).toBe('boolean')
      expect(result.version === null || typeof result.version === 'string').toBe(true)
    })

    it('version is null only when python3 could not be executed or produced no parseable output', () => {
      const result = probePython()

      // If python3 ran successfully, version is always populated — even if < 3.11.
      // version === null only when the subprocess failed entirely (binary absent, timeout, etc.)
      if (result.available) {
        expect(result.version).not.toBeNull()
      }
      // No assertion when available === false: version may be a real semver (e.g. "3.9.6")
      // or null (python3 not found), both are valid.
    })

    it('version is a semver string when available is true', () => {
      const result = probePython()

      if (result.available) {
        expect(result.version).toMatch(/^\d+\.\d+\.\d+$/)
      }
    })

    it('available is consistent with version being >= 3.11', () => {
      const result = probePython()

      if (result.version !== null) {
        const [major, minor] = result.version.split('.').map(Number)
        const expectedAvailable = major > 3 || (major === 3 && minor >= 11)
        expect(result.available).toBe(expectedAvailable)
      }
    })

    it('available is false when version is null (python3 absent or bad output)', () => {
      const result = probePython()

      if (result.version === null) {
        expect(result.available).toBe(false)
      }
    })
  })
})
