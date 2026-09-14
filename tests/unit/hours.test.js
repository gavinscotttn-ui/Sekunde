import { describe, expect, it } from 'vitest'

import { createHours } from '../../src/lib/model.js'
import { applyPreset, copyDayTo, hoursIssues, hoursToLines, isValidTime, summariseHours } from '../../src/lib/hours.js'

describe('opening hours', () => {
  it('defaults to a Monday to Friday office week', () => {
    expect(hoursToLines(createHours())).toEqual(['Mon–Fri: 09:00–17:00', 'Sat–Sun: Closed'])
  })

  it('applies the early-Friday-finish preset', () => {
    expect(hoursToLines(applyPreset(createHours(), 'earlyFinish'))).toEqual([
      'Mon–Thu: 09:00–17:00',
      'Friday: 09:00–16:00',
      'Sat–Sun: Closed',
    ])
  })

  it('opens Saturday only for the six-day preset', () => {
    const hours = applyPreset(createHours(), 'sixDay')
    expect(hours.days.sat.open).toBe(true)
    expect(hours.days.sun.open).toBe(false)
  })

  it('copies one day across the whole week', () => {
    const hours = copyDayTo(applyPreset(createHours(), 'office'), 'mon', 'all')
    expect(Object.values(hours.days).every((day) => day.open && day.from === '09:00')).toBe(true)
  })

  it('leaves an unknown preset untouched', () => {
    const hours = createHours()
    expect(applyPreset(hours, 'nope')).toBe(hours)
  })

  it('validates times', () => {
    expect(isValidTime('09:00')).toBe(true)
    expect(isValidTime('24:00')).toBe(false)
    expect(isValidTime('9:00')).toBe(false)
    expect(hoursIssues(createHours())).toEqual({})
  })

  it('groups identical consecutive days in the summary', () => {
    expect(summariseHours(createHours())).toHaveLength(2)
  })
})
