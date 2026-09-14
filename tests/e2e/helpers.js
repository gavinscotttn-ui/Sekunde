export const SAMPLE = {
  company: 'Northshore Engineering Ltd',
  person: 'Gavin Scott',
  divert: '07700 900123',
  portNumbers: '0141 111 1111 - Main number\n0141 222 2222 - Jane Smith',
  portalUser: 'Jane Smith',
}

/**
 * Choose an option inside a named group, scoped to a container when given.
 * Uses click rather than check: answering a question can make it give way to a
 * summary, and check() would then wait forever for an element that has gone.
 */
export async function choose(scope, groupName, optionLabel) {
  await scope
    .getByRole('group', { name: groupName })
    .getByRole('radio', { name: optionLabel, exact: true })
    .click()
}

export async function fillAboutStep(page) {
  await page.getByLabel('Company name').fill(SAMPLE.company)
  await page.getByLabel('Your full name').fill(SAMPLE.person)
  await page.getByRole('button', { name: 'Continue' }).click()
}

export async function fillTeamStep(page) {
  const defaults = page.locator('.panel--defaults')
  await defaults.getByRole('button', { name: /Desk phones and apps/ }).click()
  await choose(defaults, /^Mobile app/, 'iPhone (iOS)')

  await page.getByText('Paste a list instead').click()
  await page
    .getByLabel('Your staff list')
    .fill('Jane Smith, jane@northshore.co.uk\nRoss Kerr, ross@northshore.co.uk')
  await page.getByRole('button', { name: 'Add these people' }).click()

  await page.getByRole('button', { name: 'Continue' }).click()
}

export async function fillCallsStep(page) {
  await page.getByLabel('Emergency divert number').fill(SAMPLE.divert)
  await page.getByLabel('Numbers moving to the new system').fill(SAMPLE.portNumbers)
  await page.getByRole('button', { name: /^Next: menus and voicemail/ }).click()

  await choose(page, /^Do you need an auto attendant\?/, 'No')
  await choose(page, /^Do you want a company voicemail box\?/, 'No')
  await page.getByRole('button', { name: /^Next: opening hours/ }).click()

  await choose(page, /^Do the lines close at lunchtime/, 'No')
  await choose(page, /^Music or a message while callers are on hold\?/, 'No')
  await page.getByRole('button', { name: /^Next: day-to-day running/ }).click()

  await page.getByLabel('Who will look after the system?').fill(SAMPLE.portalUser)
  await choose(page, /^Do you need call pick-up groups\?/, 'No')
  await choose(page, /^Should everyone show the main number/, 'Yes, everyone shows the main number')

  await page.getByRole('button', { name: 'Continue' }).click()
}
