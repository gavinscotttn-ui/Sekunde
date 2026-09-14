import { describe, expect, it } from 'vitest'

import { applyEmailPattern, buildEmail, normaliseDomain, parsePeopleList } from '../../src/lib/bulk.js'
import { createPerson } from '../../src/lib/model.js'

describe('pasting a staff list', () => {
  it('reads the shapes people actually paste', () => {
    const parsed = parsePeopleList(
      ['Jane Smith', 'Ross Kerr, ross@x.co.uk', 'Aisha Khan <aisha@x.co.uk>', 'Priya Rao\tpriya@x.co.uk'].join('\n'),
    )
    expect(parsed).toEqual([
      { name: 'Jane Smith', email: '' },
      { name: 'Ross Kerr', email: 'ross@x.co.uk' },
      { name: 'Aisha Khan', email: 'aisha@x.co.uk' },
      { name: 'Priya Rao', email: 'priya@x.co.uk' },
    ])
  })

  it('skips blank lines and duplicates', () => {
    expect(parsePeopleList('Jane Smith\n\n  \nJane Smith')).toHaveLength(1)
  })

  it('falls back to the local part when only an address is given', () => {
    expect(parsePeopleList('jane.smith@x.co.uk')).toEqual([{ name: 'jane smith', email: 'jane.smith@x.co.uk' }])
  })
})

describe('email patterns', () => {
  it('tidies whatever the customer types as a domain', () => {
    expect(normaliseDomain('  https://WWW.Example.co.uk/contact ')).toBe('example.co.uk')
    expect(normaliseDomain('@example.co.uk')).toBe('example.co.uk')
  })

  it('builds each supported shape', () => {
    expect(buildEmail("Michael O'Neill", 'x.co.uk', 'first')).toBe('michael@x.co.uk')
    expect(buildEmail("Michael O'Neill", 'x.co.uk', 'first.last')).toBe('michael.oneill@x.co.uk')
    expect(buildEmail("Michael O'Neill", 'x.co.uk', 'flast')).toBe('moneill@x.co.uk')
  })

  it('returns nothing it cannot build properly', () => {
    expect(buildEmail('Jane', 'not-a-domain', 'first')).toBe('')
    expect(buildEmail('', 'x.co.uk', 'first')).toBe('')
  })

  it('never overwrites an address the customer typed', () => {
    const staff = [
      createPerson({ name: 'Jane Smith', email: 'personal@elsewhere.com' }),
      createPerson({ name: 'Ross Kerr' }),
    ]
    const result = applyEmailPattern(staff, { domain: 'x.co.uk', patternId: 'first' })
    expect(result.filled).toBe(1)
    expect(result.staff[0].email).toBe('personal@elsewhere.com')
    expect(result.staff[1].email).toBe('ross@x.co.uk')
  })
})
