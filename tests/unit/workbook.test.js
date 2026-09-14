import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'

import { createForm, createPerson, createSettings } from '../../src/lib/model.js'
import {
  additionalQuestionRows,
  buildWorkbookBuffer,
  emailDetails,
  safeFilename,
  staffRows,
  workbookFileName,
} from '../../src/lib/exportWorkbook.js'

const WHEN = new Date(2026, 8, 14)

function sampleForm() {
  const form = createForm()
  form.companyName = 'Northshore Engineering Ltd'
  form.completedBy = 'Gavin Scott'
  form.contactEmail = 'gavin@northshore.co.uk'
  form.defaults = createSettings({
    voicemail: 'yes',
    voicemailToEmail: 'yes',
    callerId: 'Main office number',
    handset: 'Corded',
    mobileApp: 'iOS',
    desktopApp: 'no',
  })
  form.staff = [
    createPerson({ name: 'Jane Smith', email: 'jane@northshore.co.uk' }),
    createPerson({
      name: 'Ross Kerr',
      email: 'ross@northshore.co.uk',
      custom: createSettings({
        voicemail: 'no',
        voicemailToEmail: 'no',
        callerId: 'Alternative number',
        callerIdNumber: '0141 000 0000',
        handset: 'Cordless',
        mobileApp: 'Android',
        desktopApp: 'yes',
      }),
    }),
  ]
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

describe('file naming', () => {
  it('builds a predictable name', () => {
    expect(workbookFileName(sampleForm(), WHEN)).toBe('Northshore Engineering Ltd - CRF - 14-09-2026.xlsx')
  })

  it('removes anything an operating system would reject', () => {
    expect(safeFilename('Acme/\\:*?"<>| Ltd')).toBe('Acme Ltd')
    expect(safeFilename('   ')).toBe('Company')
    expect(safeFilename('..')).toBe('Company')
    expect(safeFilename('CON')).toBe('Company')
  })
})

describe('the email handover', () => {
  it('addresses and titles the message without leaking anything else', () => {
    const email = emailDetails(sampleForm(), WHEN)
    expect(email.to).toBe('info@telecomnetworks.co.uk')
    expect(email.subject).toBe('Northshore Engineering Ltd - CRF - 14-09-2026')
    expect(email.href.startsWith('mailto:info@telecomnetworks.co.uk?')).toBe(true)
    expect(email.href).not.toMatch(/[\n\r]/)
  })
})

describe('row building', () => {
  it('says where each person’s settings came from', () => {
    const rows = staffRows(sampleForm())
    expect(rows[0][8]).toBe('Team default')
    expect(rows[1][8]).toBe('Set individually')
    expect(rows[1][4]).toBe('Alternative number: 0141 000 0000')
  })

  it('covers every question from the classic form', () => {
    const rows = additionalQuestionRows(sampleForm())
    expect(rows).toHaveLength(13)
    expect(rows.map((row) => row[0])).toContain('Emergency divert mobile number in the event of a network outage')
    expect(rows.find((row) => row[0].startsWith('Opening and closing'))[2]).toContain('Mon–Fri: 09:00–17:00')
  })
})

describe('the generated workbook', () => {
  it('contains the expected sheets', async () => {
    const buffer = await buildWorkbookBuffer(sampleForm(), WHEN)
    const zip = await JSZip.loadAsync(buffer)
    const workbookXml = await zip.file('xl/workbook.xml').async('string')
    for (const sheet of ['Submission', 'Staff details', 'Opening hours', 'Additional questions']) {
      expect(workbookXml).toContain(sheet)
    }
  })

  it('never turns an answer into an Excel formula', async () => {
    const form = sampleForm()
    form.staff[0].name = '=cmd|/c calc!A1'
    form.additional.extraNotes = '@SUM(1+1)'
    form.companyName = '+1+1'
    const zip = await JSZip.loadAsync(await buildWorkbookBuffer(form, WHEN))
    const sheets = Object.keys(zip.files).filter((name) => /^xl\/worksheets\/.+\.xml$/.test(name))
    expect(sheets.length).toBeGreaterThan(0)
    for (const name of sheets) {
      const xml = await zip.file(name).async('string')
      expect(xml).not.toContain('<f>')
    }
  })

  it('escapes markup rather than embedding it', async () => {
    const form = sampleForm()
    form.staff[0].name = '<script>alert(1)</script>'
    const zip = await JSZip.loadAsync(await buildWorkbookBuffer(form, WHEN))
    // Answers are written as shared strings, so that is where the text lands.
    const xml = await zip.file('xl/sharedStrings.xml').async('string')
    expect(xml).not.toContain('<script>')
    expect(xml).toContain('&lt;script&gt;')
  })
})
