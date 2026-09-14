import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

import { SAMPLE, fillAboutStep, fillCallsStep, fillTeamStep } from './helpers.js'

const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04])

/** Console errors, page errors and every request the page makes. */
function watch(page) {
  const consoleErrors = []
  const pageErrors = []
  const requests = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('request', (request) => requests.push(request.url()))
  return { consoleErrors, pageErrors, requests }
}

test('loads cleanly under the production security headers', async ({ page }) => {
  const seen = watch(page)
  const response = await page.goto('/')

  const headers = response.headers()
  expect(headers['content-security-policy']).toContain("default-src 'none'")
  expect(headers['content-security-policy']).toContain("connect-src 'none'")
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('no-referrer')

  await expect(page.getByRole('heading', { name: 'Your customer requirements form' })).toBeVisible()

  expect(seen.consoleErrors).toEqual([])
  expect(seen.pageErrors).toEqual([])
  for (const url of seen.requests) {
    expect(url.startsWith('http://127.0.0.1:4173/'), `unexpected outside request: ${url}`).toBe(true)
  }
})

test('stores nothing in the browser', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Company name').fill(SAMPLE.company)
  await page.getByLabel('Your full name').fill(SAMPLE.person)

  const state = await page.evaluate(() => ({
    localStorage: window.localStorage.length,
    sessionStorage: window.sessionStorage.length,
    cookies: document.cookie,
  }))
  expect(state).toEqual({ localStorage: 0, sessionStorage: 0, cookies: '' })

  const cookies = await page.context().cookies()
  expect(cookies).toEqual([])
})

test('fills the whole form and downloads a real spreadsheet', async ({ page }) => {
  const seen = watch(page)
  await page.goto('/')

  await fillAboutStep(page)
  await expect(page.getByRole('heading', { name: 'Your team' })).toBeVisible()

  await fillTeamStep(page)
  await expect(page.getByRole('heading', { name: 'Call handling' })).toBeVisible()

  await fillCallsStep(page)
  await expect(page.getByRole('heading', { name: 'Check and send' })).toBeVisible()
  await expect(page.getByText('Everything we need is here')).toBeVisible()
  const peopleTable = page.getByRole('table').first()
  await expect(peopleTable.getByRole('cell', { name: 'Jane Smith', exact: true })).toBeVisible()
  await expect(peopleTable.getByRole('cell', { name: 'ross@northshore.co.uk', exact: true })).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download completed CRF' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^Northshore Engineering Ltd - CRF - \d{2}-\d{2}-\d{4}\.xlsx$/)

  const file = readFileSync(await download.path())
  expect(file.subarray(0, 4)).toEqual(ZIP_MAGIC)
  expect(file.length).toBeGreaterThan(5000)

  expect(seen.consoleErrors).toEqual([])
  expect(seen.pageErrors).toEqual([])
  for (const url of seen.requests) {
    expect(url.startsWith('http://127.0.0.1:4173/'), `unexpected outside request: ${url}`).toBe(true)
  }
})

test('one change to the team defaults reaches everybody', async ({ page }) => {
  await page.goto('/')
  await fillAboutStep(page)
  await fillTeamStep(page)
  await page.getByRole('button', { name: 'Back' }).click()

  await expect(page.getByText('Corded phone').first()).toBeVisible()
  await page.locator('.panel--defaults').getByRole('radio', { name: 'Cordless handset', exact: true }).check()

  const summaries = page.locator('.person__summary-text')
  await expect(summaries).toHaveCount(2)
  for (const text of await summaries.allTextContents()) {
    expect(text).toContain('Cordless phone')
  }
})

test('an individual can differ without disturbing anyone else', async ({ page }) => {
  await page.goto('/')
  await fillAboutStep(page)
  await fillTeamStep(page)
  await page.getByRole('button', { name: 'Back' }).click()

  const first = page.locator('.person').first()
  await first.getByRole('button', { name: 'Different for this person' }).click()
  await first.getByRole('group', { name: /^Desk phone/ }).getByRole('radio', { name: 'No desk phone' }).check()

  await expect(first.getByText('Set individually')).toBeVisible()
  await expect(page.locator('.person').nth(1).getByText('Team defaults')).toBeVisible()

  await expect(page.getByText('One person has their own options at the moment.')).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Use these for everyone' }).click()
  await expect(page.locator('.chip--custom')).toHaveCount(0)
})

test('saves progress to a file and resumes from it', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Company name').fill(SAMPLE.company)
  await page.getByLabel('Your full name').fill(SAMPLE.person)

  const [draft] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save progress' }).click(),
  ])
  expect(draft.suggestedFilename()).toContain('CRF progress')
  const draftPath = await draft.path()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Start again' }).click()
  await expect(page.getByLabel('Company name')).toHaveValue('')

  await page.locator('input[type="file"]').setInputFiles(draftPath)
  await expect(page.getByLabel('Company name')).toHaveValue(SAMPLE.company)
  await expect(page.getByText(/Loaded your saved answers/)).toBeVisible()
})

test('refuses a file that is not one of our saved forms', async ({ page }) => {
  await page.goto('/')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'evil.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"app":"somewhere-else","data":{"companyName":"Hacked"}}'),
  })
  await expect(page.getByText('That file is not a saved Telecom Networks form.')).toBeVisible()
  await expect(page.getByLabel('Company name')).toHaveValue('')
})

test('offers the plain blank form for anyone who would rather type it out', async ({ page }) => {
  await page.goto('/')
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Download the form' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('Telecom-Networks-CRF-blank-form.xlsx')
  const file = readFileSync(await download.path())
  expect(file.subarray(0, 4)).toEqual(ZIP_MAGIC)
})

test('sends anyone who skips a question straight back to it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Enter the company name.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Your customer requirements form' })).toBeVisible()
})
