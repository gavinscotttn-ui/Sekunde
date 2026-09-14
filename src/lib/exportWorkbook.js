// Builds the completed CRF workbook entirely in the browser. ExcelJS is loaded
// with a dynamic import so the 700 KB spreadsheet engine is only fetched when
// somebody actually reaches the download button.
//
// Every value written here is a plain string, number or Date. ExcelJS stores
// strings as text cells, so an answer beginning with "=" stays literal text in
// Excel rather than becoming a formula.

import { CONTACT, DAYS, effectiveSettings, usesTeamDefaults } from './model.js'
import { summariseHours } from './hours.js'
import { stripFilenameCharacters } from './text.js'

const PURPLE = '6F58A5'
const PURPLE_DARK = '312B46'
const PURPLE_LIGHT = 'EEEAF7'
const INK = '25232B'
const GREY = '65616D'
const LINE = 'DCD8E4'
const WHITE = 'FFFFFF'
const SOFT = 'F7F6F9'

const thinBorder = {
  top: { style: 'thin', color: { argb: LINE } },
  left: { style: 'thin', color: { argb: LINE } },
  bottom: { style: 'thin', color: { argb: LINE } },
  right: { style: 'thin', color: { argb: LINE } },
}

function applyTitle(sheet, title, subtitle, width) {
  sheet.mergeCells(1, 1, 1, width)
  const titleCell = sheet.getCell(1, 1)
  titleCell.value = title
  titleCell.font = { name: 'Aptos Display', size: 22, bold: true, color: { argb: WHITE } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE_DARK } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' }
  sheet.getRow(1).height = 38

  sheet.mergeCells(2, 1, 2, width)
  const subtitleCell = sheet.getCell(2, 1)
  subtitleCell.value = subtitle
  subtitleCell.font = { name: 'Aptos', size: 11, color: { argb: GREY } }
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE_LIGHT } }
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
  sheet.getRow(2).height = 28
}

function styleHeader(row) {
  row.height = 30
  row.eachCell((cell) => {
    cell.font = { name: 'Aptos', size: 11, bold: true, color: { argb: WHITE } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE } }
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
    cell.border = thinBorder
  })
}

function styleBody(sheet, startRow, endRow, columnCount) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    row.height = 32
    for (let column = 1; column <= columnCount; column += 1) {
      const cell = row.getCell(column)
      cell.font = { name: 'Aptos', size: 10, color: { argb: INK } }
      cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
      cell.border = thinBorder
      if (rowNumber % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SOFT } }
      }
    }
  }
}

function yesNo(value) {
  if (value === 'yes') return 'Yes'
  if (value === 'no') return 'No'
  return value || ''
}

function callerIdText(settings) {
  if (settings.callerId === 'Alternative number' && settings.callerIdNumber.trim()) {
    return `Alternative number: ${settings.callerIdNumber.trim()}`
  }
  return settings.callerId || ''
}

export function todayParts(now = new Date()) {
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return {
    filename: `${day}-${month}-${year}`,
    display: `${day}/${month}/${year}`,
    excelDate: new Date(year, now.getMonth(), now.getDate()),
  }
}

const RESERVED_NAMES = /^(con|prn|aux|nul|com\d|lpt\d)$/i

export function safeFilename(value) {
  const cleaned = stripFilenameCharacters(value)
    .replace(/\s+/g, ' ')
    .replace(/^[.\s]+|[.\s]+$/g, '')
    .slice(0, 80)
    .trim()
  if (!cleaned || RESERVED_NAMES.test(cleaned)) return 'Company'
  return cleaned
}

export function workbookFileName(data, now = new Date()) {
  return `${safeFilename(data.companyName)} - CRF - ${todayParts(now).filename}.xlsx`
}

export function emailDetails(data, now = new Date()) {
  const date = todayParts(now)
  const company = data.companyName.trim() || 'Customer'
  const subject = `${company} - CRF - ${date.filename}`
  const body = [
    `Company: ${company}`,
    `Filled in by: ${data.completedBy.trim()}`,
    `Date filled: ${date.display}`,
    '',
    'The completed CRF spreadsheet is attached.',
  ].join('\n')
  return {
    to: CONTACT.email,
    subject,
    body,
    href: `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  }
}

/** The question list, worded to match the classic CRF spreadsheet. */
export function additionalQuestionRows(data) {
  const a = data.additional
  const hasAttendant = a.autoAttendant === 'yes'
  return [
    [
      'Emergency divert mobile number in the event of a network outage',
      a.emergencyDivert.trim(),
      'Calls divert here if the network is unavailable.',
    ],
    [
      'Numbers to be ported to the new telephone system',
      a.noNumbersToPort ? 'None' : 'Provided',
      a.noNumbersToPort ? 'No existing numbers need to be ported.' : a.portNumbers.trim(),
    ],
    [
      'Do you require an auto attendant? (e.g. press 1 for sales)',
      yesNo(a.autoAttendant),
      hasAttendant ? a.autoGroups.trim() : 'Not required',
    ],
    [
      'Auto attendant: how will the recording be supplied?',
      hasAttendant ? a.autoRecording : 'Not required',
      hasAttendant ? a.autoRecordingNotes.trim() : '',
    ],
    [
      'What sequence should the calls be answered in?',
      hasAttendant ? a.callPattern : 'Not required',
      hasAttendant && a.callPattern === 'Sequential' ? 'Ring users one after another.' : '',
    ],
    [
      'Would you like a company voicemail?',
      yesNo(a.companyVoicemail),
      a.companyVoicemail === 'yes' ? a.voicemailPlan.trim() : 'Not required',
    ],
    [
      'Are the phone lines closed at lunchtime or other scheduled times?',
      yesNo(a.scheduledClosures),
      a.scheduledClosures === 'yes' ? a.closureDetails.trim() : 'No scheduled closures',
    ],
    [
      'Opening and closing times for schedules',
      'Provided',
      summariseHours(data.hours)
        .map((row) => `${row.label}: ${row.text}`)
        .join('\n') + (data.hours.notes.trim() ? `\nNotes: ${data.hours.notes.trim()}` : ''),
    ],
    [
      'Do you require music or messaging for your on-hold service?',
      yesNo(a.onHold),
      a.onHold === 'yes' ? a.onHoldPlan.trim() : 'Not required',
    ],
    [
      'Nominated onsite portal user (receives training and makes changes)',
      a.portalUser.trim(),
      '',
    ],
    [
      'Do you require call pick-up groups?',
      yesNo(a.pickupGroups),
      a.pickupGroups === 'yes' ? a.pickupDetails.trim() : 'Not required',
    ],
    [
      'Are all users to present the main number when dialling out?',
      yesNo(a.presentMain),
      a.presentMain === 'no' ? 'Use the per-user choices on the Staff details tab.' : '',
    ],
    [
      'Anything else we should know?',
      a.extraNotes.trim() ? 'Provided' : 'None',
      a.extraNotes.trim() || 'No additional notes.',
    ],
  ]
}

export function staffRows(data) {
  return data.staff.map((person) => {
    const settings = effectiveSettings(person, data.defaults)
    return [
      person.name.trim(),
      yesNo(settings.voicemail),
      settings.voicemail === 'yes' ? yesNo(settings.voicemailToEmail) : 'Not required',
      person.email.trim() || 'Not required',
      callerIdText(settings),
      settings.handset === 'None' ? 'None' : settings.handset,
      settings.mobileApp,
      yesNo(settings.desktopApp),
      usesTeamDefaults(person) ? 'Team default' : 'Set individually',
    ]
  })
}

export async function buildWorkbookBuffer(data, now = new Date()) {
  const { default: ExcelJS } = await import('exceljs')
  const date = todayParts(now)
  const company = data.companyName.trim()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Telecom Networks'
  workbook.lastModifiedBy = data.completedBy.trim()
  workbook.created = date.excelDate
  workbook.modified = date.excelDate
  workbook.company = company
  workbook.subject = 'Customer Requirements Form'
  workbook.title = `${company} Customer Requirements Form`
  workbook.description = 'Completed customer requirements for telephone system configuration.'

  // --- Submission -----------------------------------------------------------
  const overview = workbook.addWorksheet('Submission', {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  })
  overview.columns = [{ width: 28 }, { width: 64 }]
  applyTitle(overview, 'Customer Requirements Form', 'Telecom Networks', 2)
  const overviewRows = [
    ['Company', company],
    ['Completed by', data.completedBy.trim()],
    ['Contact email', data.contactEmail.trim() || 'Not supplied'],
    ['Date completed', date.excelDate],
    ['Users included', data.staff.length],
    ['Privacy', 'Created in the customer’s own browser. The website stores and transmits nothing.'],
  ]
  overview.addRows([[], ...overviewRows])
  const firstOverviewRow = 4
  const lastOverviewRow = firstOverviewRow + overviewRows.length - 1
  overview.getCell(`B${firstOverviewRow + 3}`).numFmt = 'dd/mm/yyyy'
  for (let rowNumber = firstOverviewRow; rowNumber <= lastOverviewRow; rowNumber += 1) {
    const row = overview.getRow(rowNumber)
    row.height = rowNumber === lastOverviewRow ? 48 : 26
    row.getCell(1).font = { name: 'Aptos', size: 11, bold: true, color: { argb: PURPLE_DARK } }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE_LIGHT } }
    row.getCell(2).font = { name: 'Aptos', size: 11, color: { argb: INK } }
    row.getCell(2).alignment = { vertical: 'middle', wrapText: true }
    row.eachCell((cell) => { cell.border = thinBorder })
  }

  // --- Staff details --------------------------------------------------------
  const staff = workbook.addWorksheet('Staff details', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  staff.columns = [
    { width: 26 }, { width: 13 }, { width: 19 }, { width: 30 },
    { width: 30 }, { width: 18 }, { width: 16 }, { width: 14 }, { width: 17 },
  ]
  applyTitle(staff, 'Staff details', `${company} · completed ${date.display}`, 9)
  staff.addRow([
    'Name',
    'Voicemail',
    'Voicemail to email',
    'Email address',
    'Number presented on outgoing calls',
    'Desk phone',
    'Mobile app',
    'Desktop app',
    'Settings source',
  ])
  styleHeader(staff.getRow(3))
  const rows = staffRows(data)
  rows.forEach((row) => staff.addRow(row))
  styleBody(staff, 4, 3 + rows.length, 9)
  staff.autoFilter = { from: 'A3', to: 'I3' }

  // --- Opening hours --------------------------------------------------------
  const hours = workbook.addWorksheet('Opening hours', {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  })
  hours.columns = [{ width: 18 }, { width: 14 }, { width: 14 }, { width: 44 }]
  applyTitle(hours, 'Opening hours', `${company} · used to build the call schedules`, 4)
  hours.addRow(['Day', 'Opens', 'Closes', 'Notes'])
  styleHeader(hours.getRow(3))
  DAYS.forEach((day) => {
    const entry = data.hours.days[day.key]
    hours.addRow(
      entry && entry.open ? [day.label, entry.from, entry.to, ''] : [day.label, 'Closed', 'Closed', ''],
    )
  })
  styleBody(hours, 4, 3 + DAYS.length, 4)
  if (data.hours.notes.trim()) {
    const notesRow = hours.addRow(['Notes', data.hours.notes.trim()])
    hours.mergeCells(notesRow.number, 2, notesRow.number, 4)
    styleBody(hours, notesRow.number, notesRow.number, 4)
    notesRow.height = 46
  }

  // --- Additional questions -------------------------------------------------
  const additional = workbook.addWorksheet('Additional questions', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  additional.columns = [{ width: 56 }, { width: 20 }, { width: 72 }]
  applyTitle(additional, 'Additional questions', `${company} · completed ${date.display}`, 3)
  additional.addRow(['Question', 'Answer', 'Please provide details'])
  styleHeader(additional.getRow(3))
  const questionRows = additionalQuestionRows(data)
  questionRows.forEach((row) => additional.addRow(row))
  styleBody(additional, 4, 3 + questionRows.length, 3)
  for (let rowNumber = 4; rowNumber <= 3 + questionRows.length; rowNumber += 1) {
    const detail = String(additional.getCell(rowNumber, 3).value || '')
    const question = String(additional.getCell(rowNumber, 1).value || '')
    const lines = detail.split('\n').length
    const wrapped = Math.max(Math.ceil(detail.length / 80), Math.ceil(question.length / 60), lines)
    additional.getRow(rowNumber).height = Math.min(120, Math.max(32, 16 + wrapped * 15))
  }
  additional.autoFilter = { from: 'A3', to: 'C3' }

  workbook.eachSheet((sheet) => {
    // &C centres the footer; Excel requires the position codes rather than bare text.
    sheet.headerFooter.oddFooter = `&C&"Aptos"&8Telecom Networks  ·  ${CONTACT.phone}  ·  ${CONTACT.email}`
    sheet.pageMargins = { left: 0.35, right: 0.35, top: 0.5, bottom: 0.55, header: 0.2, footer: 0.2 }
  })

  return workbook.xlsx.writeBuffer()
}

/** Hands the finished workbook to the browser's download machinery. */
export async function downloadWorkbook(data, now = new Date()) {
  const buffer = await buildWorkbookBuffer(data, now)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const name = workbookFileName(data, now)
  saveBlob(blob, name)
  return name
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}
