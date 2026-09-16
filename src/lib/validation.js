// One source of truth for "is this answer good enough to send to engineering?".
// Used by the step navigation, the error summary and the download button.

import {
  DAYS,
  effectiveSettings,
  needsEmail,
  settingsComplete,
} from './model.js'
import { hoursIssues } from './hours.js'

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isEmail(value) {
  const trimmed = value.trim()
  return trimmed.length <= 180 && EMAIL_PATTERN.test(trimmed)
}

export function phoneDigits(value) {
  return value.replace(/\D/g, '')
}

export function isPhone(value) {
  const digits = phoneDigits(value)
  return digits.length >= 10 && digits.length <= 15
}

export function looksLikeUkMobile(value) {
  const digits = phoneDigits(value)
  return /^(?:44)?7\d{9}$/.test(digits) || /^07\d{9}$/.test(digits)
}

const SETTING_MESSAGES = {
  voicemail: 'Choose what should happen when nobody answers.',
  callerId: 'Choose which number is shown on outgoing calls.',
  callerIdNumber: 'Enter the alternative number to display.',
  handset: 'Choose a desk phone option.',
  mobileApp: 'Choose a mobile app option.',
  desktopApp: 'Choose whether the desktop app is needed.',
}

export function settingsErrors(settings) {
  const errors = {}
  // Voicemail is asked as one question, so both stored fields fail together.
  if (!settings.voicemail || (settings.voicemail === 'yes' && !settings.voicemailToEmail)) {
    errors.voicemail = SETTING_MESSAGES.voicemail
  }
  if (!settings.callerId) errors.callerId = SETTING_MESSAGES.callerId
  if (settings.callerId === 'Alternative number' && !settings.callerIdNumber.trim()) {
    errors.callerIdNumber = SETTING_MESSAGES.callerIdNumber
  }
  if (!settings.handset) errors.handset = SETTING_MESSAGES.handset
  if (!settings.mobileApp) errors.mobileApp = SETTING_MESSAGES.mobileApp
  if (!settings.desktopApp) errors.desktopApp = SETTING_MESSAGES.desktopApp
  return errors
}

export function personErrors(person, defaults) {
  const errors = {}
  const settings = effectiveSettings(person, defaults)
  if (person.name.trim().length < 2) errors.name = 'Enter this person’s full name.'
  const email = person.email.trim()
  if (email && !isEmail(email)) {
    errors.email = 'Enter a valid email address.'
  } else if (!email && needsEmail(settings)) {
    errors.email = 'An email address is needed for the apps or voicemail-to-email chosen.'
  }
  if (person.custom) {
    const custom = settingsErrors(person.custom)
    for (const [key, message] of Object.entries(custom)) errors[key] = message
  } else if (!settingsComplete(defaults)) {
    errors.settings = 'Finish the team defaults above, or set this person’s own options.'
  }
  return errors
}

export function validateStep(data, step) {
  const errors = {}

  if (step === 0) {
    if (data.companyName.trim().length < 2) errors.companyName = 'Enter the company name.'
    if (data.completedBy.trim().length < 2) errors.completedBy = 'Enter your full name.'
    if (data.contactEmail.trim() && !isEmail(data.contactEmail)) {
      errors.contactEmail = 'Enter a valid email address, or leave this blank.'
    }
  }

  if (step === 1) {
    const anyInherits = data.staff.some((person) => person.custom === null)
    if (anyInherits) {
      const defaults = settingsErrors(data.defaults)
      if (Object.keys(defaults).length) errors.defaults = defaults
    }
    const staff = data.staff.map((person) => personErrors(person, data.defaults))
    if (staff.some((item) => Object.keys(item).length)) errors.staff = staff
  }

  if (step === 2) {
    const a = data.additional
    if (!isPhone(a.emergencyDivert)) {
      errors.emergencyDivert = 'Enter a contact number with at least 10 digits.'
    }
    if (!a.noNumbersToPort && a.portNumbers.trim().length < 5) {
      errors.portNumbers = 'List the numbers moving over, or tick the box below.'
    }
    if (!a.autoAttendant) errors.autoAttendant = 'Choose yes or no.'
    if (a.autoAttendant === 'yes') {
      if (a.autoGroups.trim().length < 5) errors.autoGroups = 'List each menu option and who answers it.'
      if (!a.autoRecording) errors.autoRecording = 'Choose how the recording will be supplied.'
      if (!a.callPattern) errors.callPattern = 'Choose how the calls should ring.'
    }
    if (!a.companyVoicemail) errors.companyVoicemail = 'Choose yes or no.'
    if (a.companyVoicemail === 'yes' && a.voicemailPlan.trim().length < 5) {
      errors.voicemailPlan = 'Tell us where company voicemail messages should go.'
    }
    if (!a.scheduledClosures) errors.scheduledClosures = 'Choose yes or no.'
    if (a.scheduledClosures === 'yes' && a.closureDetails.trim().length < 5) {
      errors.closureDetails = 'Add the closure times and who they affect.'
    }
    const hours = hoursIssues(data.hours)
    if (Object.keys(hours).length) errors.hours = hours
    if (!a.onHold) errors.onHold = 'Choose yes or no.'
    if (a.onHold === 'yes' && a.onHoldPlan.trim().length < 5) {
      errors.onHoldPlan = 'Tell us how the on-hold audio will be supplied.'
    }
    if (a.portalUser.trim().length < 2) errors.portalUser = 'Enter the portal user’s full name.'
    if (!a.pickupGroups) errors.pickupGroups = 'Choose yes or no.'
    if (a.pickupGroups === 'yes' && a.pickupDetails.trim().length < 5) {
      errors.pickupDetails = 'List the people in each pick-up group.'
    }
  }

  return errors
}

const STEP_LABELS = ['About you', 'Your team', 'Call handling']

/** Flat list of outstanding problems: what, where, and which anchor to focus. */
export function listProblems(data) {
  const problems = []

  const push = (step, key, message) => problems.push({ step, key, message, section: STEP_LABELS[step] })

  const about = validateStep(data, 0)
  for (const [key, message] of Object.entries(about)) push(0, key, message)

  const people = validateStep(data, 1)
  for (const [key, message] of Object.entries(people.defaults || {})) push(1, `default-${key}`, `Team default: ${message}`)
  ;(people.staff || []).forEach((item, index) => {
    for (const [key, message] of Object.entries(item)) {
      const who = data.staff[index]?.name.trim() || `Person ${index + 1}`
      push(1, `staff-${index}-${key}`, `${who}: ${message}`)
    }
  })

  const calls = validateStep(data, 2)
  for (const [key, value] of Object.entries(calls)) {
    if (key === 'hours') {
      for (const [dayKey, message] of Object.entries(value)) {
        const day = DAYS.find((item) => item.key === dayKey)
        push(2, `hours-${dayKey}`, day ? `${day.label}: ${message}` : message)
      }
    } else {
      push(2, key, value)
    }
  }

  return problems
}

export function countErrors(value) {
  if (!value || typeof value !== 'object') return 0
  return Object.values(value).reduce(
    (total, item) => total + (typeof item === 'string' ? 1 : countErrors(item)),
    0,
  )
}

export function stepIsComplete(data, step) {
  return countErrors(validateStep(data, step)) === 0
}
