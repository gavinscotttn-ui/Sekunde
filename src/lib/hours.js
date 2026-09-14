// Opening hours are captured as structured days so the customer never has to
// type the same "09:00–17:00" seven times, and so the workbook can present a
// tidy schedule table instead of a paragraph.

import { DAYS, createHours } from './model.js'

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function isValidTime(value) {
  return TIME_PATTERN.test(value)
}

export function toMinutes(value) {
  if (!isValidTime(value)) return null
  const [hours, minutes] = value.split(':')
  return Number(hours) * 60 + Number(minutes)
}

export function formatTime(value) {
  return isValidTime(value) ? value : ''
}

export const HOURS_PRESETS = [
  { id: 'office', label: 'Mon–Fri, 9am–5pm', weekdays: { open: true, from: '09:00', to: '17:00' }, weekend: { open: false } },
  { id: 'earlyFinish', label: 'Mon–Thu 9–5, Fri 9–4', custom: true },
  { id: 'sixDay', label: 'Mon–Sat, 8:30am–6pm', weekdays: { open: true, from: '08:30', to: '18:00' }, weekend: { open: 'satOnly', from: '08:30', to: '18:00' } },
  { id: 'alwaysOpen', label: 'Open every day, 24 hours', everyDay: { open: true, from: '00:00', to: '23:59' } },
]

export function applyPreset(hours, presetId) {
  const preset = HOURS_PRESETS.find((item) => item.id === presetId)
  if (!preset) return hours
  const next = { ...hours, days: { ...hours.days } }

  if (preset.id === 'earlyFinish') {
    for (const day of DAYS) {
      if (day.key === 'fri') next.days.fri = { open: true, from: '09:00', to: '16:00' }
      else if (day.weekday) next.days[day.key] = { open: true, from: '09:00', to: '17:00' }
      else next.days[day.key] = { ...next.days[day.key], open: false }
    }
    return next
  }

  if (preset.everyDay) {
    for (const day of DAYS) next.days[day.key] = { ...preset.everyDay }
    return next
  }

  for (const day of DAYS) {
    if (day.weekday) {
      next.days[day.key] = { ...next.days[day.key], ...preset.weekdays }
    } else if (preset.weekend.open === 'satOnly') {
      next.days[day.key] = day.key === 'sat'
        ? { open: true, from: preset.weekend.from, to: preset.weekend.to }
        : { ...next.days[day.key], open: false }
    } else {
      next.days[day.key] = { ...next.days[day.key], open: false }
    }
  }
  return next
}

/** Copy one day's times across a set of days, keeping each day's open/closed state. */
export function copyDayTo(hours, sourceKey, scope) {
  const source = hours.days[sourceKey]
  if (!source) return hours
  const targets = DAYS.filter((day) => {
    if (day.key === sourceKey) return false
    if (scope === 'weekdays') return day.weekday
    if (scope === 'weekend') return !day.weekday
    return true
  })
  const days = { ...hours.days }
  for (const day of targets) {
    days[day.key] = { open: source.open, from: source.from, to: source.to }
  }
  return { ...hours, days }
}

export function setDay(hours, key, patch) {
  if (!hours.days[key]) return hours
  return { ...hours, days: { ...hours.days, [key]: { ...hours.days[key], ...patch } } }
}

export function hoursIssues(hours) {
  const issues = {}
  let anyOpen = false
  for (const day of DAYS) {
    const entry = hours.days[day.key]
    if (!entry || !entry.open) continue
    anyOpen = true
    const from = toMinutes(entry.from)
    const to = toMinutes(entry.to)
    if (from === null || to === null) {
      issues[day.key] = 'Enter both times as HH:MM.'
    } else if (to <= from) {
      issues[day.key] = 'The closing time must be after the opening time.'
    }
  }
  if (!anyOpen) issues.general = 'Mark at least one day as open.'
  return issues
}

/** Human-readable summary with consecutive identical days grouped together. */
export function summariseHours(hours) {
  const rows = []
  for (const day of DAYS) {
    const entry = hours.days[day.key] || { open: false }
    const text = entry.open ? `${entry.from}–${entry.to}` : 'Closed'
    const previous = rows[rows.length - 1]
    if (previous && previous.text === text) {
      previous.end = day
    } else {
      rows.push({ start: day, end: day, text })
    }
  }
  return rows.map((row) => ({
    label: row.start === row.end ? row.start.label : `${row.start.short}–${row.end.short}`,
    text: row.text,
  }))
}

export function hoursToLines(hours) {
  const lines = summariseHours(hours).map((row) => `${row.label}: ${row.text}`)
  if (hours.notes.trim()) lines.push(`Notes: ${hours.notes.trim()}`)
  return lines
}

export { createHours }
