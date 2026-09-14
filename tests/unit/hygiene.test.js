// Guards the promises the page makes to its users. If someone later adds an
// analytics call, a storage write or an innerHTML assignment, these fail.

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = new URL('../../', import.meta.url).pathname

function collect(directory, extensions) {
  const files = []
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry)
    if (statSync(full).isDirectory()) files.push(...collect(full, extensions))
    else if (extensions.includes(extname(full))) files.push(full)
  }
  return files
}

const sourceFiles = collect(join(ROOT, 'src'), ['.js', '.jsx', '.css'])
const sources = sourceFiles.map((file) => ({ file, text: readFileSync(file, 'utf8') }))

const FORBIDDEN = [
  ['innerHTML', /\binnerHTML\b/],
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
  ['eval', /\beval\s*\(/],
  ['new Function', /new\s+Function\s*\(/],
  ['document.write', /document\.write\b/],
  ['localStorage', /\blocalStorage\b/],
  ['sessionStorage', /\bsessionStorage\b/],
  ['indexedDB', /\bindexedDB\b/],
  ['document.cookie', /document\.cookie/],
  ['fetch', /\bfetch\s*\(/],
  ['XMLHttpRequest', /\bXMLHttpRequest\b/],
  ['sendBeacon', /\bsendBeacon\b/],
  ['WebSocket', /\bWebSocket\b/],
  ['EventSource', /\bEventSource\b/],
  ['an inline style attribute', /\bstyle=\{|\bstyle="/],
  ['an insecure http:// URL', /http:\/\/(?!www\.w3\.org|localhost|127\.0\.0\.1)/],
]

describe('source hygiene', () => {
  it('finds the application sources', () => {
    expect(sourceFiles.length).toBeGreaterThan(8)
  })

  for (const [label, pattern] of FORBIDDEN) {
    it(`never uses ${label}`, () => {
      const offenders = sources.filter(({ text }) => pattern.test(text)).map(({ file }) => file)
      expect(offenders).toEqual([])
    })
  }

  it('contains no stray control characters', () => {
    const offenders = sources
      .filter(({ text }) => [...text].some((character) => {
        const code = character.codePointAt(0)
        return (code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127
      }))
      .map(({ file }) => file)
    expect(offenders).toEqual([])
  })

  it('opens external links safely', () => {
    for (const { file, text } of sources) {
      const blankLinks = text.match(/target="_blank"[^>]*/g) || []
      for (const link of blankLinks) {
        expect(link, `${file} must pair target="_blank" with rel="noreferrer noopener"`).toContain('noreferrer')
      }
    }
  })
})

describe('the page shell', () => {
  const html = readFileSync(join(ROOT, 'index.html'), 'utf8')

  it('has no inline script or style', () => {
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)/)
    expect(html).not.toMatch(/<style|style=/)
  })

  it('offers the blank form to anyone without JavaScript', () => {
    expect(html).toContain('noscript')
    expect(html).toContain('Telecom-Networks-CRF-blank-form.xlsx')
  })
})
