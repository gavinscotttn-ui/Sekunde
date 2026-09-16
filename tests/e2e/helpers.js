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
  // Options carry a short description, so the accessible name starts with the
  // label rather than equalling it.
  const label = new RegExp(`^${optionLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  await scope.getByRole('group', { name: groupName }).getByRole('radio', { name: label }).click()
}

export async function fillAboutStep(page) {
  await page.getByLabel('Company name').fill(SAMPLE.company)
  await page.getByLabel('Your full name').fill(SAMPLE.person)
  await page.getByRole('button', { name: 'Continue' }).click()
}

export async function fillTeamStep(page) {
  const defaults = page.locator('.panel--defaults')
  await defaults.getByRole('button', { name: /Desk phones and apps/ }).click()
  await choose(defaults, /^Do they need to take work calls on their mobile/, 'Yes, on iPhone')

  await page.getByText('Paste a list instead').click()
  await page
    .getByLabel('Your staff list')
    .fill('Jane Smith, jane@northshore.co.uk\nRoss Kerr, ross@northshore.co.uk')
  await page.getByRole('button', { name: 'Add these people' }).click()

  await page.getByRole('button', { name: 'Continue' }).click()
}

export async function fillCallsStep(page) {
  await page.getByLabel('If your phones ever go down, where should we send calls?').fill(SAMPLE.divert)
  await page.getByLabel('Which phone numbers do you want to keep?').fill(SAMPLE.portNumbers)
  await page.getByRole('button', { name: /^Next: how calls get answered/ }).click()

  await choose(page, /^Should callers hear a menu/, 'No')
  await choose(page, /^Do you want one shared voicemail box/, 'No')
  await page.getByRole('button', { name: /^Next: when you are open/ }).click()

  await choose(page, /^Do the phones close at any other times/, 'No')
  await choose(page, /^Should callers hear music or a message/, 'No')
  await page.getByRole('button', { name: /^Next: looking after it/ }).click()

  await page.getByLabel('Who should we train to look after the phones?').fill(SAMPLE.portalUser)
  await choose(page, /^Should people be able to answer each other/, 'No')
  await page.getByRole('button', { name: 'Continue' }).click()
}
