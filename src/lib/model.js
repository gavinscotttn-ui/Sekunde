// Shape of the customer requirements form, plus the helpers that keep every
// person in sync with the team defaults. Nothing in here touches the network,
// storage or the DOM: it is pure data so it can be unit tested in Node.

export const SCHEMA_VERSION = 3

export const CONTACT = {
  email: 'info@telecomnetworks.co.uk',
  phone: '0141 404 5441',
  phoneHref: 'tel:01414045441',
  address: '7 East Kilbride Road, Rutherglen G73 5EA',
  website: 'https://telecomnetworks.co.uk/',
}

export const BLANK_FORM_PATH = '/Telecom-Networks-CRF-blank-form.xlsx'

export const YES_NO = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

// Option labels are written the way a customer would say it. The stored values
// stay as they are, because that is the wording our engineers read in the
// finished spreadsheet.

export const CALLER_ID_OPTIONS = [
  { value: 'Main office number', label: 'Your main office number', description: 'Everyone looks like one switchboard' },
  { value: 'Direct dial', label: 'Their own direct number', description: 'Customers can ring them straight back' },
  { value: 'Alternative number', label: 'A different number', description: 'Another number on your account' },
]

export const HANDSET_OPTIONS = [
  { value: 'Corded', label: 'A corded phone', description: 'Stays on the desk' },
  { value: 'Cordless', label: 'A cordless handset', description: 'Can be carried around' },
  { value: 'None', label: 'No desk phone', description: 'They will use the apps instead' },
]

export const MOBILE_APP_OPTIONS = [
  { value: 'iOS', label: 'Yes, on iPhone' },
  { value: 'Android', label: 'Yes, on Android' },
  { value: 'None', label: 'No, not needed' },
]

export const RECORDING_OPTIONS = [
  { value: 'We already have an audio file', label: 'We will send you a file we already have' },
  { value: 'Someone in our team will record it', label: 'Someone here will record it' },
  {
    value: 'Telecom Networks to arrange a professional recording',
    label: 'Please arrange a professional one',
    description: 'Chargeable',
  },
]

export const CALL_PATTERN_OPTIONS = [
  { value: 'Simultaneous', label: 'Every phone at once', description: 'Whoever is free picks it up' },
  { value: 'Sequential', label: 'One person, then the next', description: 'In the order you give us' },
]

/**
 * Voicemail used to be two questions — "voicemail?" then "voicemail to email?" —
 * which is really one decision. The two stored fields stay, because that is what
 * the spreadsheet expects, but the customer answers once.
 */
export const VOICEMAIL_OPTIONS = [
  {
    value: 'email',
    label: 'Yes, and email it to them',
    description: 'A copy of every message lands in their inbox',
  },
  { value: 'mailbox', label: 'Yes, on the phone only', description: 'They dial in to listen' },
  { value: 'none', label: 'No voicemail', description: 'Callers hear ringing, then nothing' },
]

export function voicemailChoice(settings) {
  if (settings.voicemail === 'no') return 'none'
  if (settings.voicemail !== 'yes') return ''
  if (settings.voicemailToEmail === 'yes') return 'email'
  if (settings.voicemailToEmail === 'no') return 'mailbox'
  return ''
}

export function applyVoicemailChoice(settings, choice) {
  if (choice === 'none') return { ...settings, voicemail: 'no', voicemailToEmail: 'no' }
  if (choice === 'mailbox') return { ...settings, voicemail: 'yes', voicemailToEmail: 'no' }
  if (choice === 'email') return { ...settings, voicemail: 'yes', voicemailToEmail: 'yes' }
  return { ...settings, voicemail: '', voicemailToEmail: '' }
}

/**
 * Common ways a small team is set up. Choosing one answers most of the
 * per-user questions in a single click; anything a preset cannot safely assume
 * (which mobile platform, for instance) is asked afterwards on its own.
 */
export const TEAM_PRESETS = [
  {
    id: 'deskPhones',
    title: 'Desk phones',
    blurb: 'A corded phone on every desk. Voicemail arrives by email.',
    settings: {
      voicemail: 'yes',
      voicemailToEmail: 'yes',
      callerId: 'Main office number',
      handset: 'Corded',
      mobileApp: 'None',
      desktopApp: 'no',
    },
  },
  {
    id: 'phonesAndApp',
    title: 'Desk phones and apps',
    blurb: 'A corded phone each, plus the apps for calls away from the desk.',
    settings: {
      voicemail: 'yes',
      voicemailToEmail: 'yes',
      callerId: 'Main office number',
      handset: 'Corded',
      desktopApp: 'yes',
    },
  },
  {
    id: 'appsOnly',
    title: 'Apps only',
    blurb: 'No desk phones — everyone works from the mobile and desktop apps.',
    settings: {
      voicemail: 'yes',
      voicemailToEmail: 'yes',
      callerId: 'Main office number',
      handset: 'None',
      desktopApp: 'yes',
    },
  },
]

/** Which preset, if any, the current defaults came from. */
export function matchPreset(settings) {
  return (
    TEAM_PRESETS.find((preset) =>
      Object.entries(preset.settings).every(([key, value]) => settings[key] === value),
    ) || null
  )
}

export const DAYS = [
  { key: 'mon', label: 'Monday', short: 'Mon', weekday: true },
  { key: 'tue', label: 'Tuesday', short: 'Tue', weekday: true },
  { key: 'wed', label: 'Wednesday', short: 'Wed', weekday: true },
  { key: 'thu', label: 'Thursday', short: 'Thu', weekday: true },
  { key: 'fri', label: 'Friday', short: 'Fri', weekday: true },
  { key: 'sat', label: 'Saturday', short: 'Sat', weekday: false },
  { key: 'sun', label: 'Sunday', short: 'Sun', weekday: false },
]

// Every settings key a person can inherit from the team defaults.
export const SETTING_KEYS = [
  'voicemail',
  'voicemailToEmail',
  'callerId',
  'callerIdNumber',
  'handset',
  'mobileApp',
  'desktopApp',
]

export const MAX_STAFF = 250
export const LIMITS = {
  name: 120,
  email: 180,
  phone: 30,
  shortText: 200,
  notes: 4000,
}

export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Only reached on browsers without randomUUID; ids are local React keys, not secrets.
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256)
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function createSettings(overrides = {}) {
  return {
    voicemail: '',
    voicemailToEmail: '',
    callerId: '',
    callerIdNumber: '',
    handset: '',
    mobileApp: '',
    desktopApp: '',
    ...overrides,
  }
}

export function createPerson(overrides = {}) {
  return { id: newId(), name: '', email: '', custom: null, ...overrides }
}

export function createHours() {
  const days = {}
  for (const day of DAYS) {
    days[day.key] = day.weekday
      ? { open: true, from: '09:00', to: '17:00' }
      : { open: false, from: '09:00', to: '17:00' }
  }
  return { days, notes: '' }
}

export function createForm() {
  return {
    version: SCHEMA_VERSION,
    companyName: '',
    completedBy: '',
    contactEmail: '',
    defaults: createSettings(),
    staff: [createPerson()],
    hours: createHours(),
    additional: {
      emergencyDivert: '',
      portNumbers: '',
      noNumbersToPort: false,
      autoAttendant: '',
      autoGroups: '',
      autoRecording: '',
      autoRecordingNotes: '',
      callPattern: '',
      companyVoicemail: '',
      voicemailPlan: '',
      scheduledClosures: '',
      closureDetails: '',
      onHold: '',
      onHoldPlan: '',
      portalUser: '',
      pickupGroups: '',
      pickupDetails: '',
      extraNotes: '',
    },
  }
}

/** The settings actually in force for a person: their own, or the team defaults. */
export function effectiveSettings(person, defaults) {
  return person.custom ? person.custom : defaults
}

export function usesTeamDefaults(person) {
  return person.custom === null
}

/** True when a person needs an email address for the services they have chosen. */
export function needsEmail(settings) {
  return (
    settings.voicemailToEmail === 'yes' ||
    (Boolean(settings.mobileApp) && settings.mobileApp !== 'None') ||
    settings.desktopApp === 'yes'
  )
}

/** True when everybody is set to show the main office number when dialling out. */
export function everyonePresentsMainNumber(data) {
  return data.staff.every(
    (person) => effectiveSettings(person, data.defaults).callerId === 'Main office number',
  )
}

export function settingsComplete(settings) {
  if (!settings.voicemail || !settings.callerId || !settings.handset) return false
  if (!settings.mobileApp || !settings.desktopApp) return false
  if (settings.voicemail === 'yes' && !settings.voicemailToEmail) return false
  if (settings.callerId === 'Alternative number' && !settings.callerIdNumber.trim()) return false
  return true
}

/** Keeps dependent answers honest, e.g. no voicemail means no voicemail to email. */
export function normaliseSettings(settings) {
  const next = { ...settings }
  if (next.voicemail === 'no') next.voicemailToEmail = 'no'
  if (next.callerId !== 'Alternative number') next.callerIdNumber = ''
  return next
}

export function describeSettings(settings) {
  const parts = []
  parts.push(settings.voicemail === 'yes' ? 'Voicemail' : 'No voicemail')
  if (settings.voicemail === 'yes' && settings.voicemailToEmail === 'yes') parts.push('to email')
  if (settings.callerId) {
    parts.push(
      settings.callerId === 'Alternative number' && settings.callerIdNumber.trim()
        ? `Shows ${settings.callerIdNumber.trim()}`
        : `Shows ${settings.callerId.toLowerCase()}`,
    )
  }
  if (settings.handset) parts.push(settings.handset === 'None' ? 'No desk phone' : `${settings.handset} phone`)
  if (settings.mobileApp) parts.push(settings.mobileApp === 'None' ? 'No mobile app' : `${settings.mobileApp} app`)
  if (settings.desktopApp) parts.push(settings.desktopApp === 'yes' ? 'Desktop app' : 'No desktop app')
  return parts.join(' · ')
}
