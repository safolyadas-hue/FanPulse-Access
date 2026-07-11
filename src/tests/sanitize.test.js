import { describe, it, expect } from 'vitest'
import { sanitizeInput, isInputSafe, INPUT_LIMITS } from '../utils/sanitize.js'

describe('sanitizeInput', () => {
  it('passes through clean, ordinary text unchanged', () => {
    const result = sanitizeInput('Where is the nearest accessible restroom?', 'chat')
    expect(result.clean).toBe('Where is the nearest accessible restroom?')
    expect(result.wasModified).toBe(false)
    expect(result.wasTruncated).toBe(false)
  })

  it('strips <script> tags entirely', () => {
    const result = sanitizeInput('Hello<script>alert("xss")</script>World', 'chat')
    expect(result.clean).not.toContain('<script')
    expect(result.clean).not.toContain('alert')
    expect(result.wasModified).toBe(true)
  })

  it('strips inline event handler attributes', () => {
    const result = sanitizeInput('<img src=x onerror=alert(1)>', 'chat')
    expect(result.clean).not.toMatch(/onerror/i)
    expect(result.wasModified).toBe(true)
  })

  it('strips javascript: URI schemes', () => {
    const result = sanitizeInput('click javascript:alert(1) here', 'chat')
    expect(result.clean).not.toMatch(/javascript\s*:/i)
    expect(result.wasModified).toBe(true)
  })

  it('strips eval(...) and Function(...) injection patterns', () => {
    const result = sanitizeInput('eval(maliciousCode()) and Function("return 1")', 'chat')
    expect(result.clean).not.toMatch(/eval\s*\(/i)
    expect(result.clean).not.toMatch(/Function\s*\(/)
    expect(result.wasModified).toBe(true)
  })

  it('collapses and trims excess whitespace without flagging it as modified', () => {
    const result = sanitizeInput('  hello    world  ', 'chat')
    expect(result.clean).toBe('hello world')
  })

  it('truncates input longer than the context limit and flags wasTruncated', () => {
    const longInput = 'a'.repeat(INPUT_LIMITS.chat + 50)
    const result = sanitizeInput(longInput, 'chat')
    expect(result.clean.length).toBe(INPUT_LIMITS.chat)
    expect(result.wasTruncated).toBe(true)
  })

  it('respects the issueReport limit (1000 chars) rather than the chat limit (500)', () => {
    const input = 'b'.repeat(800)
    const result = sanitizeInput(input, 'issueReport')
    expect(result.wasTruncated).toBe(false)
    expect(result.clean.length).toBe(800)
  })

  it('falls back to the chat limit for an unrecognized context key', () => {
    const longInput = 'c'.repeat(INPUT_LIMITS.chat + 10)
    const result = sanitizeInput(longInput, 'not_a_real_context')
    expect(result.wasTruncated).toBe(true)
    expect(result.clean.length).toBe(INPUT_LIMITS.chat)
  })

  it('returns an empty, modified result for non-string input', () => {
    const result = sanitizeInput(null, 'chat')
    expect(result.clean).toBe('')
    expect(result.wasModified).toBe(true)
  })
})

describe('isInputSafe', () => {
  it('returns true for clean input that needs no changes', () => {
    expect(isInputSafe('Where is Gate A?', 'chat')).toBe(true)
  })

  it('returns false for input containing a script tag', () => {
    expect(isInputSafe('<script>alert(1)</script>', 'chat')).toBe(false)
  })

  it('returns false for input exceeding the length limit', () => {
    expect(isInputSafe('x'.repeat(INPUT_LIMITS.chat + 1), 'chat')).toBe(false)
  })

  it('returns false for non-string input', () => {
    expect(isInputSafe(12345, 'chat')).toBe(false)
  })
})
