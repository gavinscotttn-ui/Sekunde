// "Save my progress" writes a small JSON file straight to the customer's own
// device. Nothing is uploaded and nothing is kept by the website, so resuming
// is simply reading that file back.
//
// The file is treated as untrusted input on the way back in: every field is
// copied onto a freshly created form, type checked and length capped, so a
// tampered or corrupt draft cannot inject unexpected values into the app.

import {
  DAYS,
  LIMITS,
  MAX_STAFF,
  SCHEMA_VERSION,
  SETTING_KEYS,
  createForm,
  createHours,
  createPerson,
  createSettings,
  newId,
} from './model.js'
import { isValidTime } from './hours.js'
import { stripControlCharacters } from './text.js'

export const DRAFT_MAGIC = 'telecom-networks-crf'
export const DRAFT_EXTENSION = '.crf-draft.json'
export const MAX_DRAFT_BYTES = 2 * 1024 * 1024

// Strip control characters that have no business in form answers. Newlines and
// tabs survive because multi-line answers are expected.
function cleanText(value, max) {
  if (typeof value !== 'string') return ''
  return stripControlCharacters(value).slice(0, max)
}

function pickFrom(value, allowed) {
  return typeof value === 'string' && allowed.includes(value) ? value : ''
}

const YES_NO = ['yes', 'no']
const CALLER_IDS = ['Main office number', 'Direct dial', 'Alternative number']
const HANDSETS = ['Corded', 'Cordless', 'None']
const MOBILE_APPS = ['iOS', 'Android', 'None']
const RECORDINGS = [
  'We already have an audio file',
  'Someone in our team will record it',
  'Telecom Networks to arrange a professional recording',
]
const PATTERNS = ['Simultaneous', 'Sequential']

function readSettings(raw) {
  if (!raw || typeof raw !== 'object') return null
  return createSettings({
    voicemail: pickFrom(raw.voicemail, YES_NO),
    voicemailToEmail: pickFrom(raw.voicemailToEmail, YES_NO),
    callerId: pickFrom(raw.callerId, CALLER_IDS),
    callerIdNumber: cleanText(raw.callerIdNumber, LIMITS.phone),
    handset: pickFrom(raw.handset, HANDSETS),
    mobileApp: pickFrom(raw.mobileApp, MOBILE_APPS),
    desktopApp: pickFrom(raw.desktopApp, YES_NO),
  })
}

function readHours(raw) {
  const hours = createHours()
  if (!raw || typeof raw !== 'object') return hours
  const days = raw.days && typeof raw.days === 'object' ? raw.days : {}
  for (const day of DAYS) {
    const entry = days[day.key]
    if (!entry || typeof entry !== 'object') continue
    hours.days[day.key] = {
      open: entry.open === true,
      from: isValidTime(entry.from) ? entry.from : '09:00',
      to: isValidTime(entry.to) ? entry.to : '17:00',
    }
  }
  hours.notes = cleanText(raw.notes, LIMITS.notes)
  return hours
}

export function serialiseDraft(data) {
  return JSON.stringify(
    {
      app: DRAFT_MAGIC,
      version: SCHEMA_VERSION,
      savedAt: new Date().toISOString(),
      data: { ...data, staff: data.staff.map(({ id, ...person }) => person) },
    },
    null,
    2,
  )
}

export function parseDraft(text) {
  if (typeof text !== 'string' || text.length > MAX_DRAFT_BYTES) {
    throw new Error('That file is too large to be a saved form.')
  }

  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('That file is not a saved Telecom Networks form.')
  }

  if (!payload || typeof payload !== 'object' || payload.app !== DRAFT_MAGIC) {
    throw new Error('That file is not a saved Telecom Networks form.')
  }
  if (payload.version !== SCHEMA_VERSION) {
    throw new Error('That saved form came from a different version of this page. Please fill the form in again.')
  }

  const raw = payload.data && typeof payload.data === 'object' ? payload.data : {}
  const form = createForm()

  form.companyName = cleanText(raw.companyName, LIMITS.name)
  form.completedBy = cleanText(raw.completedBy, LIMITS.name)
  form.contactEmail = cleanText(raw.contactEmail, LIMITS.email)
  form.defaults = readSettings(raw.defaults) || createSettings()
  form.hours = readHours(raw.hours)

  const staff = Array.isArray(raw.staff) ? raw.staff.slice(0, MAX_STAFF) : []
  form.staff = staff
    .filter((person) => person && typeof person === 'object')
    .map((person) =>
      createPerson({
        id: newId(),
        name: cleanText(person.name, LIMITS.name),
        email: cleanText(person.email, LIMITS.email),
        custom: person.custom ? readSettings(person.custom) : null,
      }),
    )
  if (!form.staff.length) form.staff = [createPerson()]

  // Settings are rebuilt from SETTING_KEYS only, so a draft can never smuggle
  // extra keys into the model.
  for (const person of form.staff) {
    if (!person.custom) continue
    for (const key of Object.keys(person.custom)) {
      if (!SETTING_KEYS.includes(key)) delete person.custom[key]
    }
  }

  const a = raw.additional && typeof raw.additional === 'object' ? raw.additional : {}
  form.additional = {
    emergencyDivert: cleanText(a.emergencyDivert, LIMITS.phone),
    portNumbers: cleanText(a.portNumbers, LIMITS.notes),
    noNumbersToPort: a.noNumbersToPort === true,
    autoAttendant: pickFrom(a.autoAttendant, YES_NO),
    autoGroups: cleanText(a.autoGroups, LIMITS.notes),
    autoRecording: pickFrom(a.autoRecording, RECORDINGS),
    autoRecordingNotes: cleanText(a.autoRecordingNotes, LIMITS.notes),
    callPattern: pickFrom(a.callPattern, PATTERNS),
    companyVoicemail: pickFrom(a.companyVoicemail, YES_NO),
    voicemailPlan: cleanText(a.voicemailPlan, LIMITS.notes),
    scheduledClosures: pickFrom(a.scheduledClosures, YES_NO),
    closureDetails: cleanText(a.closureDetails, LIMITS.notes),
    onHold: pickFrom(a.onHold, YES_NO),
    onHoldPlan: cleanText(a.onHoldPlan, LIMITS.notes),
    portalUser: cleanText(a.portalUser, LIMITS.name),
    pickupGroups: pickFrom(a.pickupGroups, YES_NO),
    pickupDetails: cleanText(a.pickupDetails, LIMITS.notes),
    presentMain: pickFrom(a.presentMain, YES_NO),
    extraNotes: cleanText(a.extraNotes, LIMITS.notes),
  }

  return form
}
