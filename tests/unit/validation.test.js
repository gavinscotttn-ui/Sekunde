import { describe, expect, it } from 'vitest'

import { createForm, createPerson, createSettings } from '../../src/lib/model.js'
import { isEmail, isPhone, listProblems, personErrors, stepIsComplete } from '../../src/lib/validation.js'

const completeSettings = () =>
  createSettings({
    voicemail: 'yes',
    voicemailToEmail: 'yes',
    callerId: 'Main office number',
    handset: 'Corded',
    mobileApp: 'iOS',
    desktopApp: 'no',
  })

function completedForm() {
  const form = createForm()
  form.companyName = 'Northshore Engineering Ltd'
  form.completedBy = 'Gavin Scott'
  form.defaults = completeSettings()
  form.staff = [createPerson({ name: 'Jane Smith', email: 'jane@northshore.co.uk' })]
  Object.assign(form.additional, {
    emergencyDivert: '07700 900123',
    portNumbers: '0141 111 1111 - Main number',
    autoAttendant: 'no',
    companyVoicemail: 'no',
    scheduledClosures: 'no',
    onHold: 'no',
    portalUser: 'Jane Smith',
    pickupGroups: 'no',
    presentMain: 'yes',
  })
  return form
}

describe('email and phone checks', () => {
  it('accepts sensible addresses and rejects nonsense', () => {
    expect(isEmail('jane@northshore.co.uk')).toBe(true)
    expect(isEmail('jane@northshore')).toBe(false)
    expect(isEmail('jane at northshore.co.uk')).toBe(false)
    expect(isEmail(`${'a'.repeat(200)}@b.co.uk`)).toBe(false)
  })

  it('needs at least ten digits for a phone number', () => {
    expect(isPhone('07700 900123')).toBe(true)
    expect(isPhone('+44 7700 900123')).toBe(true)
    expect(isPhone('12345')).toBe(false)
  })
})

describe('form validation', () => {
  it('reports every missing answer on an empty form', () => {
    const problems = listProblems(createForm())
    expect(problems.length).toBeGreaterThan(10)
    expect(problems.some((item) => item.key === 'companyName')).toBe(true)
    expect(problems.every((item) => typeof item.message === 'string' && item.message.length > 0)).toBe(true)
  })

  it('passes a fully completed form', () => {
    expect(listProblems(completedForm())).toEqual([])
    expect([0, 1, 2].every((step) => stepIsComplete(completedForm(), step))).toBe(true)
  })

  it('requires an email address only when a service needs one', () => {
    const defaults = createSettings({ ...completeSettings(), voicemailToEmail: 'no', mobileApp: 'None' })
    const withoutEmail = createPerson({ name: 'Jane Smith' })
    expect(personErrors(withoutEmail, defaults).email).toBeUndefined()

    const appUser = createSettings({ ...defaults, mobileApp: 'Android' })
    expect(personErrors(withoutEmail, appUser).email).toBeDefined()
  })

  it('asks which number to show when an alternative caller ID is chosen', () => {
    const person = createPerson({
      name: 'Jane Smith',
      custom: createSettings({ ...completeSettings(), callerId: 'Alternative number' }),
    })
    expect(personErrors(person, completeSettings()).callerIdNumber).toBeDefined()
  })

  it('flags opening hours that close before they open', () => {
    const form = completedForm()
    form.hours.days.mon = { open: true, from: '17:00', to: '09:00' }
    expect(listProblems(form).some((item) => item.key === 'hours-mon')).toBe(true)
  })

  it('flags a week with no open days', () => {
    const form = completedForm()
    for (const key of Object.keys(form.hours.days)) form.hours.days[key].open = false
    expect(listProblems(form).some((item) => item.key === 'hours-general')).toBe(true)
  })
})
