// Helpers for the bulk-entry shortcuts: pasting a staff list, and filling in
// email addresses from a house pattern instead of typing each one.

import { MAX_STAFF } from './model.js'
import { stripControlCharacters, toSingleLine } from './text.js'
import { isEmail } from './validation.js'

const EMAIL_TOKEN = /[^\s<>,;]+@[^\s<>,;]+/

/**
 * Turn a pasted list into { name, email } entries. Accepts one person per line
 * in any of the shapes people actually paste out of a spreadsheet or address
 * book, for example:
 *   Jane Smith
 *   Jane Smith, jane@example.co.uk
 *   Jane Smith <jane@example.co.uk>
 *   Jane Smith\tjane@example.co.uk
 */
export function parsePeopleList(text) {
  const people = []
  const seen = new Set()

  for (const rawLine of stripControlCharacters(String(text || '')).split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    let email = ''
    let name = line

    const match = line.match(EMAIL_TOKEN)
    if (match) {
      const candidate = match[0].replace(/^[<([]+|[>)\]]+$/g, '')
      if (isEmail(candidate)) {
        email = candidate
        name = line.replace(match[0], ' ')
      }
    }

    name = toSingleLine(name.replace(/[<>()[\]]/g, ' ').replace(/[,;\t|]+/g, ' ')).slice(0, 120)
    if (!name && !email) continue
    if (!name && email) name = toSingleLine(email.split('@')[0].replace(/[._-]+/g, ' '))

    const key = `${name.toLowerCase()}|${email.toLowerCase()}`
    if (seen.has(key)) continue
    seen.add(key)
    people.push({ name, email })
    if (people.length >= MAX_STAFF) break
  }

  return people
}

function nameParts(name) {
  const cleaned = toSingleLine(name)
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, '')
    .replace(/['-]/g, '')
  const parts = cleaned.split(' ').filter(Boolean)
  return { first: parts[0] || '', last: parts.length > 1 ? parts[parts.length - 1] : '' }
}

export const EMAIL_PATTERNS = [
  {
    id: 'first',
    label: 'jane@',
    build: ({ first }) => first,
  },
  {
    id: 'first.last',
    label: 'jane.smith@',
    build: ({ first, last }) => (last ? `${first}.${last}` : first),
  },
  {
    id: 'flast',
    label: 'jsmith@',
    build: ({ first, last }) => (last ? `${first.slice(0, 1)}${last}` : first),
  },
  {
    id: 'firstlast',
    label: 'janesmith@',
    build: ({ first, last }) => (last ? `${first}${last}` : first),
  },
]

export function normaliseDomain(domain) {
  return toSingleLine(domain)
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '')
}

/** Build one address, or an empty string when the inputs cannot make a valid one. */
export function buildEmail(name, domain, patternId) {
  const pattern = EMAIL_PATTERNS.find((item) => item.id === patternId)
  const host = normaliseDomain(domain)
  if (!pattern || !host || !host.includes('.')) return ''
  const localPart = pattern.build(nameParts(name))
  if (!localPart) return ''
  const address = `${localPart}@${host}`
  return isEmail(address) ? address : ''
}

/**
 * Fill in missing email addresses. Existing addresses are never overwritten
 * unless `overwrite` is explicitly requested.
 */
export function applyEmailPattern(staff, { domain, patternId, overwrite = false }) {
  let filled = 0
  const next = staff.map((person) => {
    if (person.email.trim() && !overwrite) return person
    const email = buildEmail(person.name, domain, patternId)
    if (!email || email === person.email) return person
    filled += 1
    return { ...person, email }
  })
  return { staff: next, filled }
}
