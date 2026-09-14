import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  BASE_HEADERS,
  CONTENT_SECURITY_POLICY,
  CONTENT_SECURITY_POLICY_META,
  buildVercelConfig,
} from '../../security/headers.js'

function directives(policy) {
  return Object.fromEntries(
    policy.split(';').map((part) => {
      const [name, ...values] = part.trim().split(/\s+/)
      return [name, values.join(' ')]
    }),
  )
}

describe('the content security policy', () => {
  const parsed = directives(CONTENT_SECURITY_POLICY)

  it('denies everything by default', () => {
    expect(parsed['default-src']).toBe("'none'")
  })

  it('allows only our own scripts and styles', () => {
    expect(parsed['script-src']).toBe("'self'")
    expect(parsed['style-src']).toBe("'self'")
  })

  it('never permits inline code, eval or remote origins', () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/unsafe-inline|unsafe-eval|unsafe-hashes/)
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/https?:\/\//)
    expect(CONTENT_SECURITY_POLICY).not.toContain('*')
  })

  it('blocks the page from calling anywhere at all', () => {
    expect(parsed['connect-src']).toBe("'none'")
    expect(parsed['form-action']).toBe("'none'")
    expect(parsed['frame-ancestors']).toBe("'none'")
    expect(parsed['base-uri']).toBe("'none'")
    expect(parsed['object-src']).toBe("'none'")
  })

  it('asks for trusted types where the browser supports them', () => {
    expect(parsed['require-trusted-types-for']).toBe("'script'")
    expect(parsed['trusted-types']).toBe("'none'")
  })

  it('drops frame-ancestors from the meta copy, which browsers ignore there', () => {
    expect(CONTENT_SECURITY_POLICY_META).not.toContain('frame-ancestors')
    expect(CONTENT_SECURITY_POLICY_META).toContain("script-src 'self'")
  })
})

describe('the other response headers', () => {
  const headers = Object.fromEntries(BASE_HEADERS.map(({ key, value }) => [key, value]))

  it('sets the expected hardening headers', () => {
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Referrer-Policy']).toBe('no-referrer')
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin')
    expect(headers['Cross-Origin-Resource-Policy']).toBe('same-origin')
    expect(headers['Strict-Transport-Security']).toMatch(/max-age=\d+/)
  })

  it('switches off every device permission', () => {
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment', 'usb']) {
      expect(headers['Permissions-Policy']).toContain(`${feature}=()`)
    }
  })
})

describe('vercel.json', () => {
  it('matches security/headers.js exactly', () => {
    const committed = readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')
    expect(committed).toBe(`${JSON.stringify(buildVercelConfig(), null, 2)}\n`)
  })
})
