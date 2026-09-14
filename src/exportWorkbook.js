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
    row.height = 34
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

function todayParts() {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return {
    filename: `${day}-${month}-${year}`,
    display: `${day}/${month}/${year}`,
    excelDate: new Date(year, now.getMonth(), now.getDate()),
  }
}

function safeFilename(value) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80) || 'Company'
}

export function emailDetails(data) {
  const date = todayParts()
  const subject = `${data.companyName.trim()} - CRF - ${date.filename}`
  const body = `Filled in by: ${data.completedBy.trim()}\nDate filled: ${date.display}`
  return {
    subject,
    body,
    href: `mailto:info@telecomnetworks.co.uk?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
  }
}

export async function buildWorkbookBuffer(data) {
  const { default: ExcelJS } = await import('exceljs')
  const date = todayParts()
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Telecom Networks'
  workbook.lastModifiedBy = data.completedBy.trim()
  workbook.created = date.excelDate
  workbook.modified = date.excelDate
  workbook.company = data.companyName.trim()
  workbook.subject = 'Customer Requirements Form'
  workbook.title = `${data.companyName.trim()} Customer Requirements Form`
  workbook.description = 'Completed customer requirements for telephone system configuration.'

  const overview = workbook.addWorksheet('Submission', {
    views: [{ showGridLines: false }],
    pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  })
  overview.columns = [{ width: 25 }, { width: 62 }]
  applyTitle(overview, 'Customer Requirements Form', 'Telecom Networks', 2)
  const overviewRows = [
    ['Company', data.companyName.trim()],
    ['Completed by', data.completedBy.trim()],
    ['Date completed', date.excelDate],
    ['Staff included', data.staff.length],
    ['Privacy', 'Created locally in the customer’s browser. The website does not store or transmit form data.'],
  ]
  overview.addRows([[], ...overviewRows])
  overview.getCell('B6').numFmt = 'dd/mm/yyyy'
  for (let rowNumber = 4; rowNumber <= 8; rowNumber += 1) {
    const row = overview.getRow(rowNumber)
    row.height = rowNumber === 8 ? 48 : 28
    row.getCell(1).font = { name: 'Aptos', size: 11, bold: true, color: { argb: PURPLE_DARK } }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE_LIGHT } }
    row.getCell(2).font = { name: 'Aptos', size: 11, color: { argb: INK } }
    row.getCell(2).alignment = { vertical: 'middle', wrapText: true }
    row.eachCell((cell) => { cell.border = thinBorder })
  }

  const staff = workbook.addWorksheet('Staff details', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  staff.columns = [
    { width: 25 }, { width: 14 }, { width: 20 }, { width: 31 },
    { width: 24 }, { width: 20 }, { width: 18 }, { width: 17 },
  ]
  applyTitle(staff, 'Staff details', `${data.companyName.trim()} · completed ${date.display}`, 8)
  staff.addRow(['Name', 'Voicemail', 'Voicemail to email', 'Email address', 'Outgoing caller ID', 'Desk phone', 'Mobile app', 'Desktop app'])
  styleHeader(staff.getRow(3))
  data.staff.forEach((person) => {
    staff.addRow([
      person.name.trim(),
      yesNo(person.voicemail),
      person.voicemail === 'yes' ? yesNo(person.voicemailToEmail) : 'Not required',
      person.email.trim() || 'Not required',
      person.callerId,
      person.handset,
      person.mobileApp,
      yesNo(person.desktopApp),
    ])
  })
  styleBody(staff, 4, 3 + data.staff.length, 8)
  staff.autoFilter = { from: 'A3', to: 'H3' }

  const additional = workbook.addWorksheet('Additional questions', {
    views: [{ state: 'frozen', ySplit: 3, showGridLines: false }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  })
  additional.columns = [{ width: 42 }, { width: 18 }, { width: 70 }]
  applyTitle(additional, 'Additional questions', `${data.companyName.trim()} · completed ${date.display}`, 3)
  additional.addRow(['Question', 'Answer', 'Details'])
  styleHeader(additional.getRow(3))
  const a = data.additional
  const rows = [
    ['Emergency divert mobile number', a.emergencyDivert.trim(), 'Used to divert calls during a network outage.'],
    ['Numbers to port', a.noNumbersToPort ? 'None' : 'Provided', a.noNumbersToPort ? 'No numbers to port.' : a.portNumbers.trim()],
    ['Auto attendant required', yesNo(a.autoAttendant), a.autoAttendant === 'yes' ? a.autoGroups.trim() : 'Not required'],
    ['Auto attendant recording', a.autoAttendant === 'yes' ? a.autoRecording : 'Not required', a.autoAttendant === 'yes' ? a.autoRecordingNotes.trim() : ''],
    ['Call answering sequence', a.autoAttendant === 'yes' ? a.callPattern : 'Not required', ''],
    ['Company voicemail required', yesNo(a.companyVoicemail), a.companyVoicemail === 'yes' ? a.voicemailPlan.trim() : 'Not required'],
    ['Scheduled closures during the day', yesNo(a.scheduledClosures), a.scheduledClosures === 'yes' ? a.closureDetails.trim() : 'None'],
    ['Opening and closing times', 'Provided', a.openingHours.trim()],
    ['On-hold music or messaging required', yesNo(a.onHold), a.onHold === 'yes' ? a.onHoldPlan.trim() : 'Not required'],
    ['Nominated portal user', a.portalUser.trim(), ''],
    ['Call pick-up groups required', yesNo(a.pickupGroups), a.pickupGroups === 'yes' ? a.pickupDetails.trim() : 'Not required'],
    ['All users present the main number', yesNo(a.presentMain), ''],
    ['Additional notes', a.extraNotes.trim() ? 'Provided' : 'None', a.extraNotes.trim() || 'No additional notes.'],
  ]
  additional.addRows(rows)
  styleBody(additional, 4, 3 + rows.length, 3)
  for (let rowNumber = 4; rowNumber <= 3 + rows.length; rowNumber += 1) {
    const text = String(additional.getCell(rowNumber, 3).value || '')
    additional.getRow(rowNumber).height = Math.min(84, Math.max(34, 22 + Math.ceil(text.length / 80) * 14))
  }
  additional.autoFilter = { from: 'A3', to: 'C3' }

  workbook.eachSheet((sheet) => {
    sheet.headerFooter.oddFooter = 'Telecom Networks · 0141 404 5441 · info@telecomnetworks.co.uk'
    sheet.pageMargins = { left: 0.35, right: 0.35, top: 0.5, bottom: 0.55, header: 0.2, footer: 0.2 }
  })

  return workbook.xlsx.writeBuffer()
}

export async function downloadWorkbook(data) {
  const date = todayParts()
  const buffer = await buildWorkbookBuffer(data)
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${safeFilename(data.companyName)} - CRF - ${date.filename}.xlsx`
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  return anchor.download
}
