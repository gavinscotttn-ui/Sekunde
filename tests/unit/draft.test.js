import { describe, expect, it } from 'vitest'

import { createForm, createPerson, createSettings } from '../../src/lib/model.js'
import { MAX_DRAFT_BYTES, parseDraft, serialiseDraft } from '../../src/lib/draft.js'

function populated() {
  const form = createForm()
  form.companyName = 'Northshore Engineering Ltd'
  form.completedBy = 'Gavin Scott'
  form.defaults = createSettings({
    voicemail: 'yes',
    voicemailToEmail: 'yes',
    callerId: 'Direct dial',
    handset: 'Cordless',
    mobileApp: 'Android',
    desktopApp: 'yes',
  })
  form.staff = [
    createPerson({ name: 'Jane Smith', email: 'jane@x.co.uk' }),
    createPerson({ name: 'Ross Kerr', custom: createSettings({ voicemail: 'no', voicemailToEmail: 'no' }) }),
  ]
  form.additional.emergencyDivert = '07700 900123'
  form.additional.noNumbersToPort = true
  form.hours.days.sat = { open: true, from: '09:00', to: '12:30' }
  form.hours.notes = 'Closed on bank holidays'
  return form
}

describe('saving and resuming a draft', () => {
  it('survives a full round trip', () => {
    const original = populated()
    const restored = parseDraft(serialiseDraft(original))
    expect(restored.companyName).toBe(original.companyName)
    expect(restored.defaults).toEqual(original.defaults)
    expect(restored.staff.map((person) => person.name)).toEqual(['Jane Smith', 'Ross Kerr'])
    expect(restored.staff[1].custom.voicemail).toBe('no')
    expect(restored.hours.days.sat).toEqual({ open: true, from: '09:00', to: '12:30' })
    expect(restored.hours.notes).toBe('Closed on bank holidays')
    expect(restored.additional.noNumbersToPort).toBe(true)
  })

  it('gives every restored person a fresh id', () => {
    const original = populated()
    const restored = parseDraft(serialiseDraft(original))
    const ids = new Set(restored.staff.map((person) => person.id))
    expect(ids.size).toBe(restored.staff.length)
    expect(ids.has(original.staff[0].id)).toBe(false)
  })

  it('refuses files that are not saved forms', () => {
    expect(() => parseDraft('not json at all')).toThrow(/not a saved/i)
    expect(() => parseDraft(JSON.stringify({ app: 'something-else' }))).toThrow(/not a saved/i)
    expect(() => parseDraft(JSON.stringify({ app: 'telecom-networks-crf', version: 99 }))).toThrow(/different version/i)
    expect(() => parseDraft('x'.repeat(MAX_DRAFT_BYTES + 1))).toThrow(/too large/i)
  })

  it('drops values that are not on the allowed list', () => {
    const payload = JSON.parse(serialiseDraft(populated()))
    payload.data.defaults.callerId = 'Something the app never offers'
    payload.data.defaults.smuggled = 'hello'
    payload.data.additional.autoRecording = '<script>alert(1)</script>'
    const restored = parseDraft(JSON.stringify(payload))
    expect(restored.defaults.callerId).toBe('')
    expect(restored.defaults.smuggled).toBeUndefined()
    expect(restored.additional.autoRecording).toBe('')
  })

  it('caps the number of people and the length of every answer', () => {
    const payload = JSON.parse(serialiseDraft(createForm()))
    payload.data.staff = Array.from({ length: 400 }, () => ({ name: 'x'.repeat(500), email: '' }))
    payload.data.additional.extraNotes = 'y'.repeat(50_000)
    const restored = parseDraft(JSON.stringify(payload))
    expect(restored.staff.length).toBeLessThanOrEqual(250)
    expect(restored.staff[0].name.length).toBe(120)
    expect(restored.additional.extraNotes.length).toBe(4000)
  })

  it('ignores attempts to reach the prototype', () => {
    const payload = JSON.parse(serialiseDraft(createForm()))
    const hostile = JSON.stringify(payload).replace(
      '"staff": []',
      '"staff": [{"name":"Jane","__proto__":{"polluted":true}}]',
    )
    parseDraft(hostile)
    expect({}.polluted).toBeUndefined()
  })

  it('always returns at least one person', () => {
    const payload = JSON.parse(serialiseDraft(createForm()))
    payload.data.staff = []
    expect(parseDraft(JSON.stringify(payload)).staff).toHaveLength(1)
  })
})
